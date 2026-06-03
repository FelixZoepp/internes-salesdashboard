import { TIMEZONE, CLOSE_APPOINTMENT_ACTIVITY, CLOSE_DIAL_ACTIVITY } from './config';

interface CloseUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface CloseCustomActivity {
  id: string;
  custom_activity_type_id: string;
  user_id: string;
  created_by: string;
  date_created: string;
  status?: string;
  [key: string]: unknown;
}

interface CloseCustomActivityType {
  id: string;
  name: string;
  organization_id: string;
}

export interface OpenerData {
  closeUserId: string;
  email: string;
  name: string;
  dials: number;
  conversations: number;
  appointments: number;
  totalCallDuration: number;
  smsSent: number;
  emailsSent: number;
}

function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE });
  const todayStr = formatter.format(now);
  // Determine UTC offset for Berlin (CET +01:00 or CEST +02:00)
  const berlinOffset = new Intl.DateTimeFormat('en', {
    timeZone: TIMEZONE,
    timeZoneName: 'shortOffset',
  }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || '+02:00';
  const offset = berlinOffset.replace('GMT', '').replace('+', '+') || '+02:00';
  return {
    start: `${todayStr}T00:00:00${offset}`,
    end: `${todayStr}T23:59:59${offset}`,
  };
}

class CloseClient {
  private apiKey: string;
  private baseUrl = 'https://api.close.com/api/v1';
  private label: string;
  private activityTypeCache: Map<string, string> | null = null;

  constructor(apiKey: string, label: string) {
    this.apiKey = apiKey;
    this.label = label;
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '5', 10);
      console.warn(`Close API rate limited (${this.label}), retrying in ${retryAfter}s`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      return this.fetch<T>(endpoint, params);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Close API error (${this.label}): ${res.status} ${res.statusText} - ${body.slice(0, 200)}`);
    }

    return res.json() as Promise<T>;
  }

  async getUsers(): Promise<CloseUser[]> {
    const data = await this.fetch<{ data: CloseUser[] }>('/user/');
    return data.data;
  }

  /**
   * Get all Custom Activity Types to map name -> id
   * e.g. "Setting vereinbart" -> "actitype_xxx"
   */
  async getCustomActivityTypes(): Promise<Map<string, string>> {
    if (this.activityTypeCache) return this.activityTypeCache;

    const data = await this.fetch<{ data: CloseCustomActivityType[] }>('/custom_activity/type/');
    const map = new Map<string, string>();
    for (const t of data.data) {
      map.set(t.name.toLowerCase(), t.id);
    }
    this.activityTypeCache = map;
    console.log(`[${this.label}] Custom Activity Types:`, Object.fromEntries(map));
    return map;
  }

  /**
   * Fetch custom activities of a specific type for today
   */
  async getTodayCustomActivities(typeId: string): Promise<CloseCustomActivity[]> {
    const { start, end } = getTodayRange();
    const allActivities: CloseCustomActivity[] = [];
    let hasMore = true;
    let skip = 0;
    const limit = 100;

    while (hasMore) {
      const data = await this.fetch<{ data: CloseCustomActivity[]; has_more: boolean }>(
        `/activity/custom/${typeId}/`,
        {
          date_created__gte: start,
          date_created__lte: end,
          _skip: skip.toString(),
          _limit: limit.toString(),
        }
      );
      allActivities.push(...data.data);
      hasMore = data.has_more;
      skip += limit;
    }
    return allActivities;
  }

  async getOpenerData(): Promise<OpenerData[]> {
    // 1. Get users and activity type mapping
    const [users, activityTypes] = await Promise.all([
      this.getUsers(),
      this.getCustomActivityTypes(),
    ]);

    // 2. Find the type IDs for our configured activity names
    const appointmentTypeId = activityTypes.get(CLOSE_APPOINTMENT_ACTIVITY.toLowerCase());
    const dialTypeId = activityTypes.get(CLOSE_DIAL_ACTIVITY.toLowerCase());

    console.log(`[${this.label}] Looking for appointment activity: "${CLOSE_APPOINTMENT_ACTIVITY}" -> ${appointmentTypeId || 'NOT FOUND'}`);
    console.log(`[${this.label}] Looking for dial activity: "${CLOSE_DIAL_ACTIVITY}" -> ${dialTypeId || 'NOT FOUND'}`);

    if (!appointmentTypeId && !dialTypeId) {
      console.warn(`[${this.label}] No matching custom activity types found! Available types: ${Array.from(activityTypes.keys()).join(', ')}`);
    }

    // 3. Fetch today's activities for both types in parallel
    const [appointmentActivities, dialActivities] = await Promise.all([
      appointmentTypeId ? this.getTodayCustomActivities(appointmentTypeId) : Promise.resolve([]),
      dialTypeId ? this.getTodayCustomActivities(dialTypeId) : Promise.resolve([]),
    ]);

    console.log(`[${this.label}] Today: ${dialActivities.length} Protokolle, ${appointmentActivities.length} Settings vereinbart`);

    // 4. Build opener map
    const openerMap = new Map<string, OpenerData>();
    for (const user of users) {
      openerMap.set(user.id, {
        closeUserId: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        dials: 0,
        conversations: 0,
        appointments: 0,
        totalCallDuration: 0,
        smsSent: 0,
        emailsSent: 0,
      });
    }

    // 5. Count Protokolle (= Dials/Anwahlen)
    for (const activity of dialActivities) {
      const userId = activity.user_id || activity.created_by;
      const opener = openerMap.get(userId);
      if (opener) {
        opener.dials++;
      }
    }

    // 6. Count Settings vereinbart (= Termine/Appointments)
    for (const activity of appointmentActivities) {
      const userId = activity.user_id || activity.created_by;
      const opener = openerMap.get(userId);
      if (opener) {
        opener.appointments++;
      }
    }

    return Array.from(openerMap.values());
  }
}

let cachedData: { data: OpenerData[]; timestamp: number } | null = null;
const CACHE_TTL = 15000;

export async function fetchAllOpenerData(): Promise<OpenerData[]> {
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data;
  }

  const clients: CloseClient[] = [];
  if (process.env.CLOSE_API_KEY_1) {
    clients.push(new CloseClient(process.env.CLOSE_API_KEY_1, process.env.CLOSE_LABEL_1 || 'Account 1'));
  }
  if (process.env.CLOSE_API_KEY_2) {
    clients.push(new CloseClient(process.env.CLOSE_API_KEY_2, process.env.CLOSE_LABEL_2 || 'Account 2'));
  }

  if (clients.length === 0) {
    throw new Error('Keine Close API Keys konfiguriert. Setze CLOSE_API_KEY_1 und/oder CLOSE_API_KEY_2 in den Umgebungsvariablen.');
  }

  const results = await Promise.allSettled(clients.map(c => c.getOpenerData()));

  // Merge results, handle partial failures
  const merged = new Map<string, OpenerData>();
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Close API fetch failed for one account:', result.reason);
      continue;
    }
    for (const opener of result.value) {
      const existing = merged.get(opener.email);
      if (existing) {
        existing.dials += opener.dials;
        existing.conversations += opener.conversations;
        existing.appointments += opener.appointments;
        existing.totalCallDuration += opener.totalCallDuration;
      } else {
        merged.set(opener.email, { ...opener });
      }
    }
  }

  if (merged.size === 0 && results.every(r => r.status === 'rejected')) {
    throw new Error('Beide Close Accounts nicht erreichbar');
  }

  const data = Array.from(merged.values());
  cachedData = { data, timestamp: Date.now() };
  return data;
}
