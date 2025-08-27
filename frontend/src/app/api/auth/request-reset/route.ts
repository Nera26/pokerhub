import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/validators';
import { withCors } from '@/lib/cors';
import { USERS, resetCodes } from '../data';

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  const errors: Record<string, string> = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Invalid email address';
  }

  const user = USERS.find((u) => u.email === email);
  if (!errors.email && !user) {
    errors.email = 'Email not found';
  }

  if (Object.keys(errors).length > 0) {
    return withCors(
      req,
      NextResponse.json(
        { message: 'Invalid request', errors },
        { status: 400 },
      ),
    );
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes.set(email, code);

  return withCors(
    req,
    NextResponse.json({ message: 'Verification code sent' }),
  );
}

export function OPTIONS(req: NextRequest) {
  return withCors(req, NextResponse.json({}, { status: 200 }));
}
