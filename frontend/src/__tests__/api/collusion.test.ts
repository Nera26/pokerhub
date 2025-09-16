/** @jest-environment node */

jest.mock('@shared/types', () => {
  const { z } = require('zod');
  const ReviewActionSchema = z.enum(['warn', 'restrict', 'ban']);
  const ReviewActionLogSchema = z.object({
    action: ReviewActionSchema,
    reviewerId: z.string(),
    timestamp: z.number(),
  });
  return {
    FlaggedSessionsResponseSchema: z.array(
      z.object({
        id: z.string(),
        users: z.array(z.string()),
        status: z.enum(['flagged', 'warn', 'restrict', 'ban']),
      }),
    ),
    ReviewActionLogsResponseSchema: z.array(ReviewActionLogSchema),
    ReviewActionLogSchema,
    MessageResponseSchema: z.object({ message: z.string() }),
  };
});

import {
  listFlaggedSessions,
  applyAction,
  getActionHistory,
} from '@/lib/api/collusion';
import { useAuthStore } from '@/app/store/authStore';

describe('collusion api', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    useAuthStore.setState({ token: 'token' });
  });

  afterEach(() => {
    useAuthStore.setState({ token: null });
    if ((global.fetch as jest.Mock | undefined)?.mockReset) {
      (global.fetch as jest.Mock).mockReset();
    }
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('lists flagged sessions', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => [{ id: 's1', users: ['a', 'b'], status: 'flagged' }],
    });
    await expect(listFlaggedSessions()).resolves.toEqual([
      { id: 's1', users: ['a', 'b'], status: 'flagged' },
    ]);
  });

  it('applies review action', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ action: 'warn', timestamp: 1, reviewerId: 'r1' }),
    });
    await expect(applyAction('s1', 'warn', 'r1')).resolves.toEqual({
      action: 'warn',
      timestamp: 1,
      reviewerId: 'r1',
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
    await expect(getActionHistory('s1')).resolves.toEqual([
      { action: 'warn', timestamp: 1, reviewerId: 'admin1' },
    ]);
  });
});
