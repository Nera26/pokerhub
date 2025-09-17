import { jest } from '@jest/globals';
import { z } from 'zod';
import { AdminPlayerSchema } from '@shared/types';

jest.mock('../client', () => ({
  apiClient: jest.fn(),
}));

describe('wallet api', () => {
  const { apiClient } = jest.requireMock('../client') as {
    apiClient: jest.Mock;
  };

  beforeEach(() => {
    apiClient.mockReset();
    apiClient.mockResolvedValue([]);
  });

  it('fetches admin players from the shared endpoint', async () => {
    const { fetchAdminPlayers } = await import('../wallet');
    await fetchAdminPlayers();

    expect(apiClient).toHaveBeenCalledWith(
      '/api/admin/users/players',
      expect.any(z.ZodType),
      { signal: undefined },
    );

    const schema = apiClient.mock.calls[0][1] as z.ZodTypeAny;
    const sample = [{ id: '1', username: 'alice' }];
    expect(schema.parse(sample)).toEqual(
      z.array(AdminPlayerSchema).parse(sample),
    );
  });

  it('appends an optional limit query param', async () => {
    const { fetchAdminPlayers } = await import('../wallet');
    await fetchAdminPlayers({ limit: 5 });

    expect(apiClient).toHaveBeenCalledWith(
      '/api/admin/users/players?limit=5',
      expect.any(z.ZodType),
      { signal: undefined },
    );
  });
});
