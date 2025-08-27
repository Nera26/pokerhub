import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/validators';
import { withCors } from '@/lib/cors';
import { USERS, resetCodes } from '../data';

export async function POST(req: NextRequest) {
  const { email, code, password } = await req.json().catch(() => ({}));
  const errors: Record<string, string> = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Invalid email address';
  }

  if (!code) {
    errors.code = 'Code is required';
  } else if (!/^\d{6}$/.test(code)) {
    errors.code = 'Code must be 6 digits';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  const stored = resetCodes.get(email);
  if (!errors.code && stored !== code) {
    errors.code = 'Invalid or expired code';
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

  user!.password = password;
  resetCodes.delete(email);

  return withCors(
    req,
    NextResponse.json({ message: 'Password reset successfully' }),
  );
}

export function OPTIONS(req: NextRequest) {
  return withCors(req, NextResponse.json({}, { status: 200 }));
}
