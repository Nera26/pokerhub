/** @jest-environment node */

import {
  listFlaggedSessions,
  applyAction,
  getActionHistory,
} from '@/lib/api/collusion';

describe('collusion api', () => {
  it('lists flagged sessions', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => [{ id: 's1', users: ['a', 'b'], status: 'flagged' }],
    });
    await expect(listFlaggedSessions('token')).resolves.toEqual([
      { id: 's1', users: ['a', 'b'], status: 'flagged' },
    ]);
  });

  it('applies review action', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'warn' }),
    });
    await expect(applyAction('s1', 'warn', 'token')).resolves.toEqual({
      message: 'warn',
    });
  });

  it('gets action history', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => [
        { action: 'warn', timestamp: 1, reviewerId: 'admin1' },
      ],
    });
    await expect(getActionHistory('s1', 'token')).resolves.toEqual([
      { action: 'warn', timestamp: 1, reviewerId: 'admin1' },
    ]);
  });
});
