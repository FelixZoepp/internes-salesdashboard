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
  [key: string]: unknown;
}

interface CloseCustomActivityType {
  id: string;
  name: string;
  fields: Array<{ id: string; name: string; type: string }>;
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
  firstAppointmentTime?: string;
}

export interface TeamMember {
  email: string;
  closeUserId: string;
  name: string;
  team: 'felix' | 'hendrik';
  emoji: string;
}

// Die 4 Battle-Caller
export const TEAM_MEMBERS: TeamMember[] = [
  // Team Felix
  { email: 'johannes@content-leads.de', closeUserId: 'user_mKNHQXqBAlqlizVUnEln7ng516kATkBys7WU96zg0E6', name: 'Johannes', team: 'felix', emoji: '🔥' },
  { email: 'taha@content-leads.de', closeUserId: 'user_cQBA4gKgHPEiHAtaEtHHdPx1jt73LwL0N9BCvHUG4Nu', name: 'Taha', team: 'felix', emoji: '⚡' },
  // Team Hendrik
  { email: 'o3@hoffmann-wd.de', closeUserId: 'user_s3SCQuYijLchWgQBhJSsKH58DfsMcABDptmhto3UAXz', name: 'Karib', team: 'hendrik', emoji: '💎' },
  { email: 'o2@hoffmann-wd.de', closeUserId: 'user_8aTaFHt8ibP9z2u36XGGebbMVGJpqKcaUgpV78UMAwl', name: 'Renney', team: 'hendrik', emoji: '🚀' },
];

export const BATTLE_EMAILS = new Set(TEAM_MEMBERS.map(m => m.email));

function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE });
  const todayStr = formatter.format(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(tomorrow);
  return { start: todayStr, end: tomorrowStr };
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
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '5', 10);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      return this.apiFetch<T>(endpoint, params);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Close API error (${this.label}): ${res.status} - ${body.slice(0, 200)}`);
    }

    return res.json() as Promise<T>;
  }

  async getUsers(): Promise<CloseUser[]> {
    const data = await this.apiFetch<{ data: CloseUser[] }>('/user/');
    return data.data;
  }

  /**
   * Find the Cold Call activity type config.
   * A Setting = Cold Call Protokoll where:
   *   - "Entscheider" choices field = "Setting vereinbart am:"
   *   - "Kalender" datetime field has the appointment date
   */
  async getColdCallConfig(): Promise<{ coldCallTypeId: string; entscheiderFieldId: string; kalenderFieldId: string } | null> {
    const data = await this.apiFetch<{ data: CloseCustomActivityType[] }>('/custom_activity/');
    for (const t of data.data) {
      if (t.name.toLowerCase().includes('cold call')) {
        const entscheiderField = t.fields.find(f => f.name.toLowerCase().includes('entscheider'));
        const kalenderField = t.fields.find(f => f.type === 'datetime' && (f.name.includes('Kalender') || f.name.includes('kalender')));
        if (entscheiderField && kalenderField) {
          console.log(`[${this.label}] Cold Call: ${t.id}, Entscheider: ${entscheiderField.id}, Kalender: ${kalenderField.id}`);
          return { coldCallTypeId: t.id, entscheiderFieldId: entscheiderField.id, kalenderFieldId: kalenderField.id };
        }
      }
    }
    console.warn(`[${this.label}] Cold Call config not found`);
    return null;
  }

  async getTodayActivities(): Promise<CloseCustomActivity[]> {
    const { start, end } = getTodayRange();
    const allActivities: CloseCustomActivity[] = [];
    let hasMore = true;
    let skip = 0;

    while (hasMore) {
      const data = await this.apiFetch<{ data: CloseCustomActivity[]; has_more: boolean }>(
        '/activity/custom/',
        { date_created__gte: start, date_created__lte: end, _skip: skip.toString(), _limit: '100' }
      );
      allActivities.push(...data.data);
      hasMore = data.has_more;
      skip += 100;
    }
    return allActivities;
  }

  async getOpenerData(): Promise<OpenerData[]> {
    const [users, coldCallConfig, todayActivities] = await Promise.all([
      this.getUsers(),
      this.getColdCallConfig(),
      this.getTodayActivities(),
    ]);

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

    if (!coldCallConfig) return Array.from(openerMap.values());

    const { coldCallTypeId, entscheiderFieldId, kalenderFieldId } = coldCallConfig;
    const entscheiderKey = `custom.${entscheiderFieldId}`;
    const kalenderKey = `custom.${kalenderFieldId}`;

    for (const activity of todayActivities) {
      if (activity.custom_activity_type_id !== coldCallTypeId) continue;

      const userId = activity.user_id || activity.created_by;
      const opener = openerMap.get(userId);
      if (!opener) continue;

      // Every Cold Call protocol = 1 Dial
      opener.dials++;

      // Setting = Entscheider field contains "Setting vereinbart am:" AND Kalender has a date
      const entscheiderValue = String(activity[entscheiderKey] || '').toLowerCase();
      const kalenderValue = activity[kalenderKey];
      if (entscheiderValue.includes('setting vereinbart') && kalenderValue) {
        opener.appointments++;
        if (!opener.firstAppointmentTime || activity.date_created < opener.firstAppointmentTime) {
          opener.firstAppointmentTime = activity.date_created;
        }
      }
    }

    console.log(`[${this.label}] Today: ${todayActivities.length} activities`);
    for (const opener of openerMap.values()) {
      if (opener.dials > 0 || opener.appointments > 0) {
        console.log(`  ${opener.name}: ${opener.dials} Protokolle, ${opener.appointments} Settings`);
      }
    }

    return Array.from(openerMap.values());
  }
}

export interface WonDeal {
  name: string;
  value: number;
  user: string;
  date: string;
}

let cachedWonDeals: { data: WonDeal[]; timestamp: number } | null = null;
const WON_DEALS_CACHE_TTL = 30000;

export async function fetchTodayWonDeals(): Promise<WonDeal[]> {
  if (cachedWonDeals && Date.now() - cachedWonDeals.timestamp < WON_DEALS_CACHE_TTL) {
    return cachedWonDeals.data;
  }

  const apiKey = process.env.CLOSE_API_KEY_1;
  if (!apiKey) return [];

  try {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now);
    const url = new URL('https://api.close.com/api/v1/opportunity/');
    url.searchParams.set('date_won__gte', todayStr);
    url.searchParams.set('status_type', 'won');
    url.searchParams.set('_limit', '20');

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();

    const deals: WonDeal[] = (data.data || []).map((opp: any) => ({
      name: opp.lead_name || opp.contact_name || 'Unbekannt',
      value: (opp.value || 0) / 100,
      user: opp.user_name || 'Unbekannt',
      date: opp.date_won || todayStr,
    }));

    cachedWonDeals = { data: deals, timestamp: Date.now() };
    return deals;
  } catch {
    return [];
  }
}

let cachedData: { data: OpenerData[]; timestamp: number } | null = null;
const CACHE_TTL = 15000;

export async function fetchAllOpenerData(): Promise<OpenerData[]> {
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data;
  }

  const clients: CloseClient[] = [];
  if (process.env.CLOSE_API_KEY_1) clients.push(new CloseClient(process.env.CLOSE_API_KEY_1, process.env.CLOSE_LABEL_1 || 'Account 1'));
  if (process.env.CLOSE_API_KEY_2) clients.push(new CloseClient(process.env.CLOSE_API_KEY_2, process.env.CLOSE_LABEL_2 || 'Account 2'));

  if (clients.length === 0) throw new Error('Keine Close API Keys konfiguriert');

  const results = await Promise.allSettled(clients.map(c => c.getOpenerData()));

  const errors: string[] = [];
  const merged = new Map<string, OpenerData>();
  for (const result of results) {
    if (result.status === 'rejected') {
      errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      continue;
    }
    for (const opener of result.value) {
      const teamMember = TEAM_MEMBERS.find(m => m.closeUserId === opener.closeUserId);
      const key = teamMember?.email || opener.email;
      const existing = merged.get(key);
      if (existing) {
        existing.dials += opener.dials;
        existing.appointments += opener.appointments;
        if (opener.firstAppointmentTime && (!existing.firstAppointmentTime || opener.firstAppointmentTime < existing.firstAppointmentTime)) {
          existing.firstAppointmentTime = opener.firstAppointmentTime;
        }
      } else {
        merged.set(key, { ...opener, name: teamMember?.name || opener.name, email: key });
      }
    }
  }

  if (merged.size === 0 && results.every(r => r.status === 'rejected')) {
    throw new Error(`Beide Close Accounts nicht erreichbar: ${errors.join(' | ')}`);
  }

  // One-time fix 2026-06-08: Taha made 54 Protokolle from Felix's account
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
  if (todayStr === '2026-06-08') {
    const taha = merged.get('taha@content-leads.de');
    if (taha) {
      taha.dials += 54;
    }
  }

  // Only show battle callers
  const data = Array.from(merged.values()).filter(o => BATTLE_EMAILS.has(o.email));
  cachedData = { data, timestamp: Date.now() };
  return data;
}
