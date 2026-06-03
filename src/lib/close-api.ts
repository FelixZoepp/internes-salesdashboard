import { CONVERSATION_THRESHOLD_SECONDS, TIMEZONE } from './config';

interface CloseUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface CloseCall {
  id: string;
  user_id: string;
  duration: number;
  created_by: string;
  date_created: string;
  direction: string;
  disposition?: string;
}

interface CloseOpportunity {
  id: string;
  created_by: string;
  date_created: string;
  status_type: string;
  confidence: number;
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
  calls: CloseCall[];
}

function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE });
  const todayStr = formatter.format(now);
  return {
    start: `${todayStr}T00:00:00+02:00`,
    end: `${todayStr}T23:59:59+02:00`,
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
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      return this.fetch<T>(endpoint, params);
    }

    if (!res.ok) {
      throw new Error(`Close API error (${this.label}): ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  async getUsers(): Promise<CloseUser[]> {
    const data = await this.fetch<{ data: CloseUser[] }>('/user/');
    return data.data;
  }

  async getTodayCalls(): Promise<CloseCall[]> {
    const { start, end } = getTodayRange();
    const allCalls: CloseCall[] = [];
    let hasMore = true;
    let skip = 0;
    const limit = 100;

    while (hasMore) {
      const data = await this.fetch<{ data: CloseCall[]; has_more: boolean }>('/activity/call/', {
        date_created__gte: start,
        date_created__lte: end,
        _skip: skip.toString(),
        _limit: limit.toString(),
      });
      allCalls.push(...data.data);
      hasMore = data.has_more;
      skip += limit;
    }
    return allCalls;
  }

  async getTodayOpportunities(): Promise<CloseOpportunity[]> {
    const { start, end } = getTodayRange();
    const data = await this.fetch<{ data: CloseOpportunity[] }>('/opportunity/', {
      date_created__gte: start,
      date_created__lte: end,
      _limit: '200',
    });
    return data.data;
  }

  async getOpenerData(): Promise<OpenerData[]> {
    const [users, calls, opportunities] = await Promise.all([
      this.getUsers(),
      this.getTodayCalls(),
      this.getTodayOpportunities(),
    ]);

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
        calls: [],
      });
    }

    for (const call of calls) {
      const opener = openerMap.get(call.user_id);
      if (opener) {
        opener.dials++;
        opener.totalCallDuration += call.duration || 0;
        opener.calls.push(call);
        if ((call.duration || 0) >= CONVERSATION_THRESHOLD_SECONDS) {
          opener.conversations++;
        }
      }
    }

    for (const opp of opportunities) {
      const opener = openerMap.get(opp.created_by);
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
    throw new Error('No Close API keys configured');
  }

  const results = await Promise.all(clients.map(c => c.getOpenerData()));

  // Merge by email
  const merged = new Map<string, OpenerData>();
  for (const accountData of results) {
    for (const opener of accountData) {
      const existing = merged.get(opener.email);
      if (existing) {
        existing.dials += opener.dials;
        existing.conversations += opener.conversations;
        existing.appointments += opener.appointments;
        existing.totalCallDuration += opener.totalCallDuration;
        existing.smsSent += opener.smsSent;
        existing.emailsSent += opener.emailsSent;
        existing.calls.push(...opener.calls);
      } else {
        merged.set(opener.email, { ...opener });
      }
    }
  }

  const data = Array.from(merged.values());
  cachedData = { data, timestamp: Date.now() };
  return data;
}
