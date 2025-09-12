import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const manifestPath = join(process.cwd(), '.next', 'precache-manifest.json');
    const data = await fs.readFile(manifestPath, 'utf-8');
    const urls = JSON.parse(data);
    return NextResponse.json(urls);
  } catch {
    return NextResponse.json([]);
  }
}
