import { useLeaderboardRanges } from '@/lib/api/leaderboard';
import { apiClient } from '@/lib/api/client';
import { useQuery } from '@tanstack/react-query';
import { LeaderboardRangesResponseSchema } from '@shared/types';

jest.mock('@/lib/api/client', () => ({ apiClient: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

const useQueryMock = useQuery as unknown as jest.Mock;
const apiClientMock = apiClient as jest.Mock;

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
