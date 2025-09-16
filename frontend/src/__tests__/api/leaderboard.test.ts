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
import { leaderboard } from '../fixtures/leaderboard';

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

describe('leaderboard api', () => {
  beforeEach(() => {
    apiClientMock.mockResolvedValue(leaderboard);
  });

  afterEach(() => {
    apiClientMock.mockReset();
  });

  it('fetches leaderboard from /api/leaderboard', async () => {
    await expect(fetchLeaderboard()).resolves.toEqual(leaderboard);
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
