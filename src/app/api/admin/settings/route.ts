import { NextResponse } from 'next/server';
import { POINTS, TEAM_DAILY_GOAL, TEAM_WEEKLY_GOAL, CONVERSATION_THRESHOLD_SECONDS } from '@/lib/config';

export async function GET() {
  return NextResponse.json({
    points: POINTS,
    teamDailyGoal: TEAM_DAILY_GOAL,
    teamWeeklyGoal: TEAM_WEEKLY_GOAL,
    conversationThreshold: CONVERSATION_THRESHOLD_SECONDS,
  });
}
