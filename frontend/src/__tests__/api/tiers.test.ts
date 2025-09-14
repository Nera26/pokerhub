import { fetchTiers } from '@/lib/api/tiers';
import { safeApiClient } from '@/lib/api/utils';
import { TiersSchema } from '@shared/types';

jest.mock('@/lib/api/utils', () => ({ safeApiClient: jest.fn() }));

const safeApiClientMock = safeApiClient as jest.Mock;

describe('fetchTiers', () => {
  afterEach(() => {
    safeApiClientMock.mockReset();
  });

  it('invokes apiClient with correct arguments', async () => {
    safeApiClientMock.mockResolvedValue([]);
    await fetchTiers();
    expect(safeApiClientMock).toHaveBeenCalledWith('/api/tiers', TiersSchema, {
      signal: undefined,
      errorMessage: 'Failed to fetch tiers',
    });
  });
});
