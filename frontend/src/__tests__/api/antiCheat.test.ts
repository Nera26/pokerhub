/** @jest-environment node */

import { fetchNextAction } from '@/lib/api/antiCheat';

describe('anti-cheat api', () => {
  it('fetches next action', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ next: 'restrict' }),
    });
    await expect(fetchNextAction('warn')).resolves.toBe('restrict');
  });
});
