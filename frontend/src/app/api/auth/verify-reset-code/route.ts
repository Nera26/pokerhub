import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/validators';
import { withCors } from '@/lib/cors';
import { resetCodes } from '../data';

export async function POST(req: NextRequest) {
  const { email, code } = await req.json().catch(() => ({}));
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

  const stored = resetCodes.get(email);
  if (!errors.code && stored !== code) {
    errors.code = 'Invalid or expired code';
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

  return withCors(req, NextResponse.json({ message: 'Code verified' }));
}

export function OPTIONS(req: NextRequest) {
  return withCors(req, NextResponse.json({}, { status: 200 }));
}
