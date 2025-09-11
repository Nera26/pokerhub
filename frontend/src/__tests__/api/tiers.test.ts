import { fetchTiers } from '@/lib/api/tiers';
import { apiClient } from '@/lib/api/client';
import { TiersSchema } from '@shared/types';

jest.mock('@/lib/api/client', () => ({ apiClient: jest.fn() }));

const apiClientMock = apiClient as jest.Mock;

describe('fetchTiers', () => {
  afterEach(() => {
    apiClientMock.mockReset();
  });

  it('invokes apiClient with correct arguments', async () => {
    apiClientMock.mockResolvedValue([]);
    await fetchTiers();
    expect(apiClientMock).toHaveBeenCalledWith('/api/tiers', TiersSchema, {
      signal: undefined,
    });
  });
});
