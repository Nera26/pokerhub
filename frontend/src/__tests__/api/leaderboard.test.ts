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

describe('createLeaderboardMetaQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({});
    apiClientMock.mockResolvedValue({ ranges: [] });
  });

  afterEach(() => {
    useQueryMock.mockReset();
    apiClientMock.mockReset();
  });

  it('creates a leaderboard metadata query', async () => {
    const result = createLeaderboardMetaQuery(
      'ranges',
      '/api/leaderboard/ranges',
      LeaderboardRangesResponseSchema,
    );

    expect(result).toEqual({});
    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: ['leaderboard', 'ranges'],
      queryFn: expect.any(Function),
    });

    const { queryFn } = useQueryMock.mock.calls[0][0];
    await queryFn();

    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/leaderboard/ranges',
      LeaderboardRangesResponseSchema,
    );
  });
});

describe('useLeaderboardRanges', () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({});
    apiClientMock.mockResolvedValue({ ranges: [] });
  });
  afterEach(() => {
    useQueryMock.mockReset();
    apiClientMock.mockReset();
  });

  it('invokes apiClient with correct arguments', async () => {
    useLeaderboardRanges();
    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: ['leaderboard', 'ranges'],
      queryFn: expect.any(Function),
    });
    const { queryFn } = useQueryMock.mock.calls[0][0];
    await queryFn();
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/leaderboard/ranges',
      LeaderboardRangesResponseSchema,
    );
  });
});

describe('useLeaderboardModes', () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({});
    apiClientMock.mockResolvedValue({ modes: [] });
  });
  afterEach(() => {
    useQueryMock.mockReset();
    apiClientMock.mockReset();
  });

  it('invokes apiClient with correct arguments', async () => {
    useLeaderboardModes();
    expect(useQueryMock).toHaveBeenCalledWith({
      queryKey: ['leaderboard', 'modes'],
      queryFn: expect.any(Function),
    });
    const { queryFn } = useQueryMock.mock.calls[0][0];
    await queryFn();
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/leaderboard/modes',
      LeaderboardModesResponseSchema,
    );
  });
});

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
