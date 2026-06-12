import { NextResponse } from 'next/server';
import { TEAM_MEMBERS, BATTLE_EMAILS } from '@/lib/close-api';
import { TIMEZONE } from '@/lib/config';
import { INCENTIVES } from '@/lib/incentives';

interface CloseCustomActivityType {
  id: string;
  name: string;
}

interface CloseCustomActivity {
  id: string;
  custom_activity_type_id: string;
  user_id: string;
  created_by: string;
  date_created: string;
  [key: string]: unknown;
}

async function closeFetch<T>(apiKey: string, endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`https://api.close.com/api/v1${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Close API: ${res.status}`);
  return res.json() as Promise<T>;
}

function getDateRange(period: 'today' | 'week' | 'month'): { start: string; end: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE });
  const todayStr = formatter.format(now);
  const berlinDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const tomorrow = new Date(berlinDate);
  tomorrow.setDate(berlinDate.getDate() + 1);
  const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(tomorrow);

  let startStr: string;

  if (period === 'today') {
    startStr = todayStr;
  } else if (period === 'week') {
    const dayOfWeek = berlinDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(berlinDate);
    monday.setDate(berlinDate.getDate() + mondayOffset);
    startStr = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(monday);
  } else {
    startStr = `${todayStr.slice(0, 8)}01`;
  }

  // Close API works best with simple date strings (no timezone offset)
  return { start: startStr, end: tomorrowStr };
}

interface ColdCallConfig {
  coldCallTypeId: string;
  entscheiderFieldId: string;
  kalenderFieldId: string;
}

async function fetchActivitiesForPeriod(apiKey: string, start: string, end: string) {
  // Get activity types and find Cold Call config
  const typesData = await closeFetch<{ data: Array<{ id: string; name: string; fields: Array<{ id: string; name: string; type: string }> }> }>(apiKey, '/custom_activity/');

  let config: ColdCallConfig | null = null;
  for (const t of typesData.data) {
    if (t.name.toLowerCase().includes('cold call')) {
      const entscheiderField = t.fields.find(f => f.name.toLowerCase().includes('entscheider'));
      const kalenderField = t.fields.find(f => f.type === 'datetime' && (f.name.includes('Kalender') || f.name.includes('kalender')));
      if (entscheiderField && kalenderField) {
        config = { coldCallTypeId: t.id, entscheiderFieldId: entscheiderField.id, kalenderFieldId: kalenderField.id };
      }
    }
  }

  // Fetch all custom activities in range
  const allActivities: CloseCustomActivity[] = [];
  let hasMore = true;
  let skip = 0;
  while (hasMore) {
    const data = await closeFetch<{ data: CloseCustomActivity[]; has_more: boolean }>(
      apiKey, '/activity/custom/',
      { date_created__gte: start, date_created__lte: end, _skip: skip.toString(), _limit: '100' }
    );
    allActivities.push(...data.data);
    hasMore = data.has_more;
    skip += 100;
  }

  return { activities: allActivities, config };
}

interface DayStats {
  date: string;
  appointments: number;
  firstAppointmentTime?: string;
}

function calculateDailyIncentives(dayStats: DayStats): { earned: string[]; bonus: number } {
  const earned: string[] = [];
  let bonus = 0;
  const exclusiveGroupUsed = new Set<string>();

  for (const inc of INCENTIVES) {
    if (inc.check({ appointments: dayStats.appointments, firstAppointmentTime: dayStats.firstAppointmentTime })) {
      // Skip if an exclusive group member already triggered (first match wins = highest tier)
      if (inc.exclusive && exclusiveGroupUsed.has(inc.exclusive)) continue;
      if (inc.exclusive) exclusiveGroupUsed.add(inc.exclusive);

      earned.push(inc.id);
      const match = inc.bonus.match(/(\d+)/);
      if (match) bonus += parseInt(match[1]);
    }
  }
  return { earned, bonus };
}

let cachedProvisions: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 1 min cache

export async function GET() {
  try {
    if (cachedProvisions && Date.now() - cachedProvisions.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedProvisions.data);
    }

    const accounts: { key: string; label: string }[] = [];
    if (process.env.CLOSE_API_KEY_1) accounts.push({ key: process.env.CLOSE_API_KEY_1, label: 'Account 1' });
    if (process.env.CLOSE_API_KEY_2) accounts.push({ key: process.env.CLOSE_API_KEY_2, label: 'Account 2' });

    const weekRange = getDateRange('week');
    const monthRange = getDateRange('month');

    // Fetch month data (includes week)
    const results = await Promise.allSettled(
      accounts.map(a => fetchActivitiesForPeriod(a.key, monthRange.start, monthRange.end))
    );

    // Group settings per user per day
    // userEmail -> date -> { appointments, firstTime }
    const userDayMap = new Map<string, Map<string, { appointments: number; firstTime?: string }>>();

    for (const result of results) {
      if (result.status === 'rejected') continue;
      const { activities, config } = result.value;
      if (!config) continue;

      const entKey = `custom.${config.entscheiderFieldId}`;
      const kalKey = `custom.${config.kalenderFieldId}`;

      for (const act of activities) {
        if (act.custom_activity_type_id !== config.coldCallTypeId) continue;
        // Setting = Entscheider contains "Setting vereinbart" AND Kalender has a date
        const entVal = String(act[entKey] || '').toLowerCase();
        const kalVal = act[kalKey];
        if (!entVal.includes('setting vereinbart') || !kalVal) continue;

        const userId = act.user_id || act.created_by;
        const member = TEAM_MEMBERS.find(m => m.closeUserId === userId);
        if (!member || !BATTLE_EMAILS.has(member.email)) continue;

        const dateStr = new Date(act.date_created).toLocaleDateString('en-CA', { timeZone: TIMEZONE });

        // Skip weekends — no bonuses on Sat/Sun
        const actDate = new Date(dateStr + 'T12:00:00');
        const dayOfWeek = actDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        if (!userDayMap.has(member.email)) userDayMap.set(member.email, new Map());
        const dayMap = userDayMap.get(member.email)!;
        if (!dayMap.has(dateStr)) dayMap.set(dateStr, { appointments: 0 });
        const day = dayMap.get(dateStr)!;

        day.appointments++;
        if (!day.firstTime || act.date_created < day.firstTime) {
          day.firstTime = act.date_created;
        }
      }
    }

    // Calculate provisions per opener
    const todayRange = getDateRange('today');
    const todayStr = todayRange.start.slice(0, 10);
    const weekStart = weekRange.start.slice(0, 10);
    const monthStart = monthRange.start.slice(0, 10);

    // Early Bird: nur der ERSTE Opener pro Tag bekommt den €10 Bonus
    // Sammle pro Tag die früheste firstTime über alle User
    const earlyBirdWinnerPerDay = new Map<string, string>(); // date -> email des Ersten
    for (const [email, dayMap] of userDayMap) {
      for (const [dateStr, stats] of dayMap) {
        if (!stats.firstTime) continue;
        const currentWinner = earlyBirdWinnerPerDay.get(dateStr);
        if (!currentWinner) {
          // Prüfe ob die Zeit überhaupt vor 10 Uhr ist
          const hours = parseInt(
            new Intl.DateTimeFormat('en', { hour: 'numeric', hour12: false, timeZone: TIMEZONE }).format(new Date(stats.firstTime))
          );
          if (hours < 10) {
            earlyBirdWinnerPerDay.set(dateStr, email);
          }
        } else {
          // Vergleiche mit aktuellem Winner
          const currentWinnerTime = (() => {
            for (const [e, dm] of userDayMap) {
              if (e === currentWinner) return dm.get(dateStr)?.firstTime;
            }
            return undefined;
          })();
          if (currentWinnerTime && stats.firstTime < currentWinnerTime) {
            // Neuer Winner — prüfe ob vor 10 Uhr
            const hours = parseInt(
              new Intl.DateTimeFormat('en', { hour: 'numeric', hour12: false, timeZone: TIMEZONE }).format(new Date(stats.firstTime))
            );
            if (hours < 10) {
              earlyBirdWinnerPerDay.set(dateStr, email);
            }
          }
        }
      }
    }

    const provisions = TEAM_MEMBERS.filter(m => BATTLE_EMAILS.has(m.email)).map(member => {
      const dayMap = userDayMap.get(member.email) || new Map();
      let todayBonus = 0;
      let weekBonus = 0;
      let monthBonus = 0;
      const todayDetails: Array<{ date: string; appointments: number; bonus: number; incentives: string[] }> = [];
      const weekDetails: Array<{ date: string; appointments: number; bonus: number; incentives: string[] }> = [];
      const monthDetails: Array<{ date: string; appointments: number; bonus: number; incentives: string[] }> = [];

      for (const [dateStr, stats] of dayMap) {
        // Early Bird nur für den Ersten des Tages — sonst firstTime entfernen
        const isEarlyBirdWinner = earlyBirdWinnerPerDay.get(dateStr) === member.email;
        const { earned, bonus } = calculateDailyIncentives({
          date: dateStr,
          appointments: stats.appointments,
          firstAppointmentTime: isEarlyBirdWinner ? stats.firstTime : undefined,
        });

        const detail = { date: dateStr, appointments: stats.appointments, bonus, incentives: earned };

        if (dateStr >= monthStart) {
          monthBonus += bonus;
          monthDetails.push(detail);
        }
        if (dateStr >= weekStart) {
          weekBonus += bonus;
          weekDetails.push(detail);
        }
        if (dateStr === todayStr) {
          todayBonus += bonus;
          todayDetails.push(detail);
        }
      }

      todayDetails.sort((a, b) => a.date.localeCompare(b.date));
      weekDetails.sort((a, b) => a.date.localeCompare(b.date));
      monthDetails.sort((a, b) => a.date.localeCompare(b.date));

      return {
        email: member.email,
        name: member.name,
        emoji: member.emoji,
        team: member.team,
        todayBonus,
        weekBonus,
        monthBonus,
        todaySettings: todayDetails.reduce((s, d) => s + d.appointments, 0),
        weekSettings: weekDetails.reduce((s, d) => s + d.appointments, 0),
        monthSettings: monthDetails.reduce((s, d) => s + d.appointments, 0),
        todayDetails,
        weekDetails,
        monthDetails,
      };
    });

    const data = {
      provisions,
      totals: {
        todayBonus: provisions.reduce((s, p) => s + p.todayBonus, 0),
        weekBonus: provisions.reduce((s, p) => s + p.weekBonus, 0),
        monthBonus: provisions.reduce((s, p) => s + p.monthBonus, 0),
      },
    };

    cachedProvisions = { data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch (error) {
    console.error('Provisions API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
