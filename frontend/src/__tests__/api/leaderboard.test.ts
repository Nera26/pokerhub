/** @jest-environment node */

import {
  fetchLeaderboard,
  useLeaderboardRanges,
  useLeaderboardModes,
} from '@/lib/api/leaderboard';
import { apiClient } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import {
  LeaderboardRangesResponseSchema,
  LeaderboardModesResponseSchema,
} from '@shared/types';
import { leaderboard } from '../fixtures/leaderboard';

jest.mock('@/lib/api/client', () => ({ apiClient: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

const useQueryMock = useQuery as unknown as jest.Mock;
const apiClientMock = apiClient as jest.Mock;

describe('leaderboard api', () => {
  it('fetches leaderboard', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => leaderboard,
    });

    await expect(fetchLeaderboard()).resolves.toEqual(leaderboard);
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
