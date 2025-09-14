import { fetchTiers } from '@/lib/api/tiers';
import { fetchList } from '@/lib/api/fetchList';
import { TiersSchema } from '@shared/types';

jest.mock('@/lib/api/fetchList', () => ({ fetchList: jest.fn() }));

const fetchListMock = fetchList as jest.Mock;

describe('fetchTiers', () => {
  afterEach(() => {
    fetchListMock.mockReset();
  });

  it('invokes apiClient with correct arguments', async () => {
    fetchListMock.mockResolvedValue([]);
    await fetchTiers();
    expect(fetchListMock).toHaveBeenCalledWith('/api/tiers', TiersSchema, {
      signal: undefined,
    });
  });
});
