import { NextRequest, NextResponse } from 'next/server';
import { withCors } from '@/lib/cors';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ message: 'Logged out' });
  res.cookies.set('session', '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return withCors(req, res);
}

export function OPTIONS(req: NextRequest) {
  return withCors(req, NextResponse.json({}, { status: 200 }));
}
