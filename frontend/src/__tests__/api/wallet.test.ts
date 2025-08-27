/** @jest-environment node */

import { reserve, commit, rollback, withdraw } from '@/lib/api/wallet';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('wallet api', () => {
  it('handles reserve/commit/rollback/withdraw', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'ok' }),
    });

    await expect(reserve('u1', 10)).resolves.toEqual({ message: 'ok' });
    await expect(commit('u1', 10)).resolves.toEqual({ message: 'ok' });
    await expect(rollback('u1', 10)).resolves.toEqual({ message: 'ok' });
    await expect(withdraw('u1', 10, 'd1')).resolves.toEqual({ message: 'ok' });
  });
});
