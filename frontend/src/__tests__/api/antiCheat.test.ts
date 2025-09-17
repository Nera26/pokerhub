/** @jest-environment node */

import { fetchNextAction } from '@/lib/api/antiCheat';

describe('anti-cheat api', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('fetches next action', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ next: 'restrict' }),
    });
    await expect(fetchNextAction('warn')).resolves.toBe('restrict');
  });

  it('returns null when escalation is complete', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ next: null }),
    });
    await expect(fetchNextAction('ban')).resolves.toBeNull();
  });
});
