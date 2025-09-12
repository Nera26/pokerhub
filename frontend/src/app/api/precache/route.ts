import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
  try {
    const base = env.NEXT_PUBLIC_BASE_URL ?? '';
    const res = await fetch(`${base}/precache-manifest`);
    if (!res.ok) throw new Error('Failed to fetch');
    const urls = await res.json();
    return NextResponse.json(urls);
  } catch {
    return NextResponse.json([]);
  }
}
