import { NextRequest, NextResponse } from 'next/server';

export function withCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get('origin');
  if (origin) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  return res;
}
