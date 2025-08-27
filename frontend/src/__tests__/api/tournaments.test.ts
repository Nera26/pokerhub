/** @jest-environment node */

import { GET as getTournaments } from '@/app/api/tournaments/route';

describe('tournaments API', () => {
  it('returns tournaments list', async () => {
    const res = await getTournaments();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(3);
  });
});
