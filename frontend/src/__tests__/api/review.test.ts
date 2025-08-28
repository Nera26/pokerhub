/** @jest-environment node */

import { listFlaggedSessions, applyReviewAction } from '@/lib/api/review';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('review api', () => {
  it('lists flagged sessions', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => [
        { id: 's1', users: ['a', 'b'], status: 'flagged' },
      ],
    });
    await expect(listFlaggedSessions()).resolves.toEqual([
      { id: 's1', users: ['a', 'b'], status: 'flagged' },
    ]);
  });

  it('applies review action', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'warn' }),
    });
    await expect(applyReviewAction('s1', 'warn')).resolves.toEqual({
      message: 'warn',
    });
  });
});
