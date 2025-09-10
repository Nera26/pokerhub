/** @jest-environment node */

import {
  fetchChipDenominations,
  updateChipDenominations,
} from '@/lib/api/config';

describe('config api', () => {
  it('fetches chip denominations', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ denoms: [100, 25] }),
    });

    await expect(fetchChipDenominations()).resolves.toEqual({
      denoms: [100, 25],
    });
  });

  it('updates chip denominations', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ denoms: [500, 100, 25] }),
    });

    await expect(updateChipDenominations([500, 100, 25])).resolves.toEqual({
      denoms: [500, 100, 25],
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/config/chips',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ denoms: [500, 100, 25] }),
      }),
    );
  });
});
