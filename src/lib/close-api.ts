import { TIMEZONE } from './config';

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
  user_name?: string;
}

interface CloseCustomActivityType {
  id: string;
  name: string;
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

// Hardcoded team mapping — wer sind die Caller die gegeneinander battlen
export interface TeamMember {
  email: string;
  closeUserId: string;
  name: string;
  team: 'felix' | 'hendrik';
  emoji: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  // Team Felix (Account 1: Content-Leads)
  { email: 'taha@content-leads.de', closeUserId: 'user_cQBA4gKgHPEiHAtaEtHHdPx1jt73LwL0N9BCvHUG4Nu', name: 'Taha', team: 'felix', emoji: '⚡' },
  { email: 'johannes@content-leads.de', closeUserId: 'user_mKNHQXqBAlqlizVUnEln7ng516kATkBys7WU96zg0E6', name: 'Johannes', team: 'felix', emoji: '🔥' },
  { email: 'felix@content-leads.de', closeUserId: 'user_RZ3tYRZawQGacSrskWunisLNG4cAU8Dh5yqNUXOszBb', name: 'Felix', team: 'felix', emoji: '👑' },
  // Team Hendrik (Account 2: Hoffmann)
  { email: 'o1@hoffmann-wd.de', closeUserId: 'user_jg9rTIVCxTBXUIsbatPhujMADNLR5cj7bHZGNlhg9mC', name: 'Opener 1', team: 'hendrik', emoji: '💎' },
  { email: 'o2@hoffmann-wd.de', closeUserId: 'user_8aTaFHt8ibP9z2u36XGGebbMVGJpqKcaUgpV78UMAwl', name: 'Opener 2', team: 'hendrik', emoji: '🚀' },
  { email: 'o3@hoffmann-wd.de', closeUserId: 'user_s3SCQuYijLchWgQBhJSsKH58DfsMcABDptmhto3UAXz', name: 'Opener 3', team: 'hendrik', emoji: '🎯' },
  { email: 'hendrik@hoffmann-wd.de', closeUserId: 'user_AKQijtNFeJVgnXsqb2Lfpc9VzIpV775r6qDSnLuZYzp', name: 'Hendrik', team: 'hendrik', emoji: '🦁' },
];

function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE });
  const todayStr = formatter.format(now);
  const berlinOffset = new Intl.DateTimeFormat('en', {
    timeZone: TIMEZONE,
    timeZoneName: 'shortOffset',
  }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || '+02:00';
  const offset = berlinOffset.replace('GMT', '') || '+02:00';
  return {
    start: `${todayStr}T00:00:00${offset}`,
    end: `${todayStr}T23:59:59${offset}`,
  };
}

class CloseClient {
  private apiKey: string;
  private baseUrl = 'https://api.close.com/api/v1';
  private label: string;

  constructor(apiKey: string, label: string) {
    this.apiKey = apiKey;
    this.label = label;
  }

  private async apiFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
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
      return this.apiFetch<T>(endpoint, params);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Close API error (${this.label}): ${res.status} ${res.statusText} - ${body.slice(0, 200)}`);
    }

    return res.json() as Promise<T>;
  }

  async getUsers(): Promise<CloseUser[]> {
    const data = await this.apiFetch<{ data: CloseUser[] }>('/user/');
    return data.data;
  }

  /**
   * Get Custom Activity Type name->id mapping
   * Endpoint: /custom_activity/ (not /custom_activity/type/)
   */
  async getCustomActivityTypes(): Promise<Map<string, string>> {
    const data = await this.apiFetch<{ data: CloseCustomActivityType[] }>('/custom_activity/');
    const map = new Map<string, string>();
    for (const t of data.data) {
      map.set(t.id, t.name);
      console.log(`[${this.label}] Activity Type: ${t.id} = "${t.name}"`);
    }
    return map;
  }

  /**
   * Fetch all custom activities for today
   * The activity type name tells us what it is:
   * - "1 - Gesprächsprotokoll (Cold Call)" = Anwahl/Dial
   * - "2 - Gesprächsprotokoll (Setting)" = Termin/Setting vereinbart
   */
  async getTodayCustomActivities(): Promise<CloseCustomActivity[]> {
    const { start, end } = getTodayRange();
    const allActivities: CloseCustomActivity[] = [];
    let hasMore = true;
    let skip = 0;
    const limit = 100;

    while (hasMore) {
      const data = await this.apiFetch<{ data: CloseCustomActivity[]; has_more: boolean }>(
        '/activity/custom/',
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
    const [users, activityTypes, todayActivities] = await Promise.all([
      this.getUsers(),
      this.getCustomActivityTypes(),
      this.getTodayCustomActivities(),
    ]);

    // Build type id -> category mapping
    const typeCategory = new Map<string, 'dial' | 'setting'>();
    for (const [id, name] of activityTypes) {
      const lower = name.toLowerCase();
      if (lower.includes('cold call') || lower.includes('protokoll')) {
        typeCategory.set(id, 'dial');
      } else if (lower.includes('setting')) {
        typeCategory.set(id, 'setting');
      }
    }

    // Build opener map
    const openerMap = new Map<string, OpenerData>();
    for (const user of users) {
      openerMap.set(user.id, {
        closeUserId: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        dials: 0,
        conversations: 0,
        appointments: 0,
        totalCallDuration: 0,
        smsSent: 0,
        emailsSent: 0,
      });
    }

    // Count activities per user
    for (const activity of todayActivities) {
      const userId = activity.user_id || activity.created_by;
      const opener = openerMap.get(userId);
      if (!opener) continue;

      const category = typeCategory.get(activity.custom_activity_type_id);
      if (category === 'dial') {
        opener.dials++;
      } else if (category === 'setting') {
        opener.appointments++;
      }
    }

    console.log(`[${this.label}] Today: ${todayActivities.length} total custom activities`);
    for (const opener of openerMap.values()) {
      if (opener.dials > 0 || opener.appointments > 0) {
        console.log(`  ${opener.name}: ${opener.dials} dials, ${opener.appointments} settings`);
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
    throw new Error('Keine Close API Keys konfiguriert');
  }

  const results = await Promise.allSettled(clients.map(c => c.getOpenerData()));

  const merged = new Map<string, OpenerData>();
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Close API fetch failed:', result.reason);
      continue;
    }
    for (const opener of result.value) {
      // Use team member mapping for name/email if available
      const teamMember = TEAM_MEMBERS.find(m => m.closeUserId === opener.closeUserId);
      const key = teamMember?.email || opener.email;
      const existing = merged.get(key);
      if (existing) {
        existing.dials += opener.dials;
        existing.appointments += opener.appointments;
      } else {
        merged.set(key, {
          ...opener,
          name: teamMember?.name || opener.name,
          email: key,
        });
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
