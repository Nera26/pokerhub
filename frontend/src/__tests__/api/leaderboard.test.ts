/** @jest-environment node */

import {
  fetchLeaderboard,
  createLeaderboardMetaQuery,
  useLeaderboardRanges,
  useLeaderboardModes,
  listLeaderboardConfig,
  createLeaderboardConfig,
  updateLeaderboardConfig,
  deleteLeaderboardConfig,
} from '@/lib/api/leaderboard';
import { apiClient } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import {
  LeaderboardRangesResponseSchema,
  LeaderboardModesResponseSchema,
  LeaderboardResponseSchema,
  LeaderboardConfigListResponseSchema,
} from '@shared/types';
import type { LeaderboardEntry } from '@shared/types';

jest.mock('@/lib/api/client', () => ({ apiClient: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

const useQueryMock = useQuery as unknown as jest.Mock;
const apiClientMock = apiClient as jest.Mock;

type LeaderboardMetaCase = {
  key: 'ranges' | 'modes';
  endpoint: string;
  schema:
    | typeof LeaderboardRangesResponseSchema
    | typeof LeaderboardModesResponseSchema;
  hook: () => unknown;
  mockResponse: Record<string, unknown>;
};

const leaderboardMetaCases: LeaderboardMetaCase[] = [
  {
    key: 'ranges',
    endpoint: '/api/leaderboard/ranges',
    schema: LeaderboardRangesResponseSchema,
    hook: useLeaderboardRanges,
    mockResponse: { ranges: [] },
  },
  {
    key: 'modes',
    endpoint: '/api/leaderboard/modes',
    schema: LeaderboardModesResponseSchema,
    hook: useLeaderboardModes,
    mockResponse: { modes: [] },
  },
];

const mockLeaderboard: LeaderboardEntry[] = [
  {
    playerId: 'alice',
    rank: 1,
    points: 100,
    rd: 40,
    volatility: 0.06,
    net: 10,
    bb100: 5,
    hours: 2,
    roi: 0.2,
    finishes: { 1: 1 },
  },
  {
    playerId: 'bob',
    rank: 2,
    points: 90,
    rd: 40,
    volatility: 0.06,
    net: 8,
    bb100: 4,
    hours: 1.5,
    roi: -0.1,
    finishes: { 2: 1 },
  },
];

describe('leaderboard api', () => {
  beforeEach(() => {
    apiClientMock.mockResolvedValue(mockLeaderboard);
  });

  afterEach(() => {
    apiClientMock.mockReset();
  });

  it('fetches leaderboard from /api/leaderboard', async () => {
    await expect(fetchLeaderboard()).resolves.toEqual(mockLeaderboard);
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/leaderboard',
      LeaderboardResponseSchema,
      { signal: undefined },
    );
  });
});

describe.each(leaderboardMetaCases)(
  'leaderboard $key metadata helpers',
  ({ key, endpoint, schema, hook, mockResponse }) => {
    beforeEach(() => {
      useQueryMock.mockReturnValue({});
      apiClientMock.mockResolvedValue(mockResponse);
    });

    afterEach(() => {
      useQueryMock.mockReset();
      apiClientMock.mockReset();
    });

    it('creates a leaderboard metadata query', async () => {
      const result = createLeaderboardMetaQuery(key, endpoint, schema);

      expect(result).toEqual({});
      expect(useQueryMock).toHaveBeenCalledWith({
        queryKey: ['leaderboard', key],
        queryFn: expect.any(Function),
      });

      const { queryFn } = useQueryMock.mock.calls[0][0];
      await queryFn();

      expect(apiClientMock).toHaveBeenCalledWith(endpoint, schema);
    });

    it('invokes the leaderboard metadata hook', async () => {
      hook();

      expect(useQueryMock).toHaveBeenCalledWith({
        queryKey: ['leaderboard', key],
        queryFn: expect.any(Function),
      });

      const { queryFn } = useQueryMock.mock.calls[0][0];
      await queryFn();

      expect(apiClientMock).toHaveBeenCalledWith(endpoint, schema);
    });
  },
);

describe('admin leaderboard config api', () => {
  beforeEach(() => {
    apiClientMock.mockResolvedValue({ configs: [] });
  });
  afterEach(() => {
    apiClientMock.mockReset();
  });

  it('lists config', async () => {
    await listLeaderboardConfig();
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/leaderboard-config',
      LeaderboardConfigListResponseSchema,
    );
  });

  it('creates config', async () => {
    await createLeaderboardConfig({ range: 'daily', mode: 'cash' });
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/leaderboard-config',
      LeaderboardConfigListResponseSchema,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updates config', async () => {
    await updateLeaderboardConfig({
      range: 'daily',
      mode: 'cash',
      newRange: 'weekly',
      newMode: 'cash',
    });
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/leaderboard-config',
      LeaderboardConfigListResponseSchema,
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('deletes config', async () => {
    await deleteLeaderboardConfig({ range: 'daily', mode: 'cash' });
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/leaderboard-config',
      LeaderboardConfigListResponseSchema,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
