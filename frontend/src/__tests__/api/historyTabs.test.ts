import { fetchHistoryTabs } from '@/lib/api/historyTabs';
import { fetchList } from '@/lib/api/fetchList';
import { HistoryTabItemSchema } from '@shared/types';

jest.mock('@/lib/api/fetchList', () => ({ fetchList: jest.fn() }));

const fetchListMock = fetchList as jest.Mock;

describe('fetchHistoryTabs', () => {
  afterEach(() => {
    fetchListMock.mockReset();
  });

  it('invokes fetchList with correct arguments and returns tabs', async () => {
    fetchListMock.mockResolvedValue([]);
    const result = await fetchHistoryTabs();
    expect(fetchListMock).toHaveBeenCalledWith(
      '/api/history-tabs',
      HistoryTabItemSchema,
      { signal: undefined },
    );
    expect(result).toEqual([]);
  });
});
