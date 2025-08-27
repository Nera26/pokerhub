/** @jest-environment node */

import { GET as getTables } from '@/app/api/tables/route';
import { GET as getTableById } from '@/app/api/tables/[id]/route';

describe('tables API', () => {
  it('returns all tables', async () => {
    const res = await getTables();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(4);
  });

  it('returns table details by id', async () => {
    const res = await getTableById(new Request('http://test/api/tables/1'), { params: Promise.resolve({ id: '1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.smallBlind).toBe(1);
  });

  it('returns 404 for missing table', async () => {
    const res = await getTableById(new Request('http://test/api/tables/999'), { params: Promise.resolve({ id: '999' }) });
    expect(res.status).toBe(404);
  });
});
