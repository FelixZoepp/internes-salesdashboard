import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const challenges = await prisma.challenge.findMany({
    orderBy: { createdAt: 'desc' },
    include: { progress: { include: { opener: true } } },
  });
  return NextResponse.json(challenges);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const challenge = await prisma.challenge.create({
    data: {
      title: body.title,
      description: body.description,
      targetType: body.targetType,
      targetValue: body.targetValue,
      reward: body.reward,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isActive: true,
    },
  });
  return NextResponse.json(challenge);
}
