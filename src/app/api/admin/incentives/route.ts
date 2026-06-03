import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const incentives = await prisma.incentive.findMany({
    orderBy: { createdAt: 'desc' },
    include: { progress: { include: { opener: true } } },
  });
  return NextResponse.json(incentives);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const incentive = await prisma.incentive.create({
    data: {
      title: body.title,
      description: body.description,
      condition: body.condition,
      emoji: body.emoji || '🏆',
      imageUrl: body.imageUrl,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isActive: true,
    },
  });
  return NextResponse.json(incentive);
}
