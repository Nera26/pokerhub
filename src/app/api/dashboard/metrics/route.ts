import { NextResponse } from 'next/server';

export const revalidate = 60; // metrics can change, but not too frequently

export async function GET() {
  // Mocked metrics data; in real app, fetch from database or external service
  return NextResponse.json({ online: 247, revenue: 45892 });
}
