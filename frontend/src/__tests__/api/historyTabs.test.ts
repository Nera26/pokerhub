import { fetchHistoryTabs } from '@/lib/api/historyTabs';
import { safeApiClient } from '@/lib/api/utils';
import { HistoryTabsResponseSchema } from '@shared/types';

jest.mock('@/lib/api/utils', () => ({ safeApiClient: jest.fn() }));

const safeApiClientMock = safeApiClient as jest.Mock;

describe('fetchHistoryTabs', () => {
  afterEach(() => {
    safeApiClientMock.mockReset();
  });

  it('invokes safeApiClient with correct arguments and returns tabs', async () => {
    safeApiClientMock.mockResolvedValue({ tabs: [] });
    const result = await fetchHistoryTabs();
    expect(safeApiClientMock).toHaveBeenCalledWith(
      '/api/history-tabs',
      HistoryTabsResponseSchema,
      { signal: undefined, errorMessage: 'Failed to fetch history tabs' },
    );
    expect(result).toEqual([]);
  });
});
