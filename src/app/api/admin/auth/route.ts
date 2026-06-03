import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PASSWORD } from '@/lib/config';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password === ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_auth', 'true', { httpOnly: true, maxAge: 60 * 60 * 24, path: '/' });
    return response;
  }
  return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
}
