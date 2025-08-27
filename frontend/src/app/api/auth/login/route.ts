import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/validators';
import { withCors } from '@/lib/cors';
import { env } from '@/lib/env';
import { USERS } from '../data';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  const errors: Record<string, string> = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Invalid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return withCors(
      req,
      NextResponse.json({ message: 'Invalid login', errors }, { status: 400 }),
    );
  }

  const user = USERS.find((u) => u.email === email);
  if (!user || user.password !== password) {
    return withCors(
      req,
      NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 },
      ),
    );
  }

  const token = `mock-token-${user.id}`;
  const res = NextResponse.json({ token });
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  return withCors(req, res);
}

export function OPTIONS(req: NextRequest) {
  return withCors(req, NextResponse.json({}, { status: 200 }));
}
