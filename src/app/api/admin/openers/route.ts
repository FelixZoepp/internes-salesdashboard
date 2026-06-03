import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const openers = await prisma.opener.findMany({ orderBy: { displayName: 'asc' } });
  return NextResponse.json(openers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const opener = await prisma.opener.upsert({
    where: { email: body.email },
    update: {
      displayName: body.displayName,
      avatarEmoji: body.avatarEmoji,
      closeUserId1: body.closeUserId1,
      closeUserId2: body.closeUserId2,
      isActive: body.isActive ?? true,
    },
    create: {
      email: body.email,
      displayName: body.displayName,
      avatarEmoji: body.avatarEmoji || '👤',
      closeUserId1: body.closeUserId1,
      closeUserId2: body.closeUserId2,
      isActive: true,
    },
  });
  return NextResponse.json(opener);
}
