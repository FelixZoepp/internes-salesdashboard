import { NextResponse } from 'next/server';
import { fetchAllOpenerData, OpenerData, TEAM_MEMBERS } from '@/lib/close-api';
import { getMockData, calculatePoints, MOCK_AVATARS } from '@/lib/mock-data';
import { MOCK_DATA, LEVELS, TEAM_DAILY_GOAL, TEAM_WEEKLY_GOAL } from '@/lib/config';
import { INCENTIVES } from '@/lib/incentives';

function getLevel(points: number) {
  let level: { name: string; minPoints: number; color: string } = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.minPoints) level = l;
  }
  return level;
}

let previousState: Map<string, { dials: number; conversations: number; appointments: number; points: number; rank: number }> = new Map();

export async function GET() {
  try {
    let rawData: OpenerData[];

    if (MOCK_DATA) {
      rawData = getMockData();
    } else {
      rawData = await fetchAllOpenerData();
    }

    const enriched = rawData.map(o => {
      const points = calculatePoints(o);
      const level = getLevel(points);
      const teamMember = TEAM_MEMBERS.find(m => m.email === o.email || m.closeUserId === o.closeUserId);
      const earnedIncentives = INCENTIVES.filter(inc =>
        inc.check({ appointments: o.appointments, firstAppointmentTime: o.firstAppointmentTime })
      ).map(inc => ({ id: inc.id, emoji: inc.emoji, title: inc.title, bonus: inc.bonus }));
      return {
        ...o,
        points,
        rank: 0,
        level: level.name,
        levelColor: level.color,
        streak: 0,
        badges: [] as string[],
        avatarEmoji: MOCK_DATA ? (MOCK_AVATARS[o.email] || '👤') : (teamMember?.emoji || '👤'),
        displayName: teamMember?.name || o.name,
        team: teamMember?.team || 'unknown',
        earnedIncentives,
      };
    });

    // Sort by points descending
    enriched.sort((a, b) => b.points - a.points);
    enriched.forEach((o, i) => { o.rank = i + 1; });

    // Detect events
    const events: Array<{ type: string; message: string; timestamp: number; openerName: string }> = [];
    const now = Date.now();

    for (const opener of enriched) {
      const prev = previousState.get(opener.email);
      if (prev) {
        if (opener.appointments > prev.appointments) {
          events.push({ type: 'appointment', message: `🔥 ${opener.displayName} hat gerade ein Setting vereinbart!`, timestamp: now, openerName: opener.displayName });
        }
        if (opener.dials >= 50 && prev.dials < 50) {
          events.push({ type: 'milestone', message: `💪 ${opener.displayName}: 50 Protokolle erreicht!`, timestamp: now, openerName: opener.displayName });
        }
        if (opener.dials >= 100 && prev.dials < 100) {
          events.push({ type: 'milestone', message: `💯 ${opener.displayName}: 100 Protokolle — Century Club!`, timestamp: now, openerName: opener.displayName });
        }
        if (opener.rank === 1 && prev.rank !== 1) {
          events.push({ type: 'leader_change', message: `👑 Führungswechsel! ${opener.displayName} ist jetzt #1!`, timestamp: now, openerName: opener.displayName });
        }
        if (opener.rank <= 3 && prev.rank > 3) {
          events.push({ type: 'rankup', message: `🚀 ${opener.displayName} steigt auf Platz ${opener.rank}!`, timestamp: now, openerName: opener.displayName });
        }
      }
    }

    previousState = new Map(enriched.map(o => [o.email, { dials: o.dials, conversations: o.conversations, appointments: o.appointments, points: o.points, rank: o.rank }]));

    // Team stats
    const teamFelix = enriched.filter(o => o.team === 'felix');
    const teamHendrik = enriched.filter(o => o.team === 'hendrik');

    const teamStats = {
      totalDials: enriched.reduce((s, o) => s + o.dials, 0),
      totalConversations: enriched.reduce((s, o) => s + o.conversations, 0),
      totalAppointments: enriched.reduce((s, o) => s + o.appointments, 0),
      totalPoints: enriched.reduce((s, o) => s + o.points, 0),
      dailyGoal: TEAM_DAILY_GOAL,
      weeklyGoal: TEAM_WEEKLY_GOAL,
      weeklyAppointments: enriched.reduce((s, o) => s + o.appointments, 0),
      teams: {
        felix: {
          name: 'Team Felix',
          dials: teamFelix.reduce((s, o) => s + o.dials, 0),
          appointments: teamFelix.reduce((s, o) => s + o.appointments, 0),
          points: teamFelix.reduce((s, o) => s + o.points, 0),
        },
        hendrik: {
          name: 'Team Hendrik',
          dials: teamHendrik.reduce((s, o) => s + o.dials, 0),
          appointments: teamHendrik.reduce((s, o) => s + o.appointments, 0),
          points: teamHendrik.reduce((s, o) => s + o.points, 0),
        },
      },
    };

    return NextResponse.json({ openers: enriched, teamStats, events, timestamp: now });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Dashboard-Daten konnten nicht geladen werden', details: String(error) },
      { status: 500 }
    );
  }
}
