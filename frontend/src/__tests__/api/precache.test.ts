/** @jest-environment node */

import { GET } from '@/app/api/precache/route';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('/api/precache', () => {
  const manifestPath = join(process.cwd(), '.next', 'precache-manifest.json');

  afterEach(async () => {
    try {
      await fs.unlink(manifestPath);
    } catch {}
  });

  it('returns manifest urls when file exists', async () => {
    await fs.mkdir(join(process.cwd(), '.next'), { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify(['/', '/favicon.ico']));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual(['/', '/favicon.ico']);
  });

  it('returns empty array when manifest missing', async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });
});
