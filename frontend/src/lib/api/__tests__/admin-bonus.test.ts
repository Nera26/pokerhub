import { jest } from '@jest/globals';
import { z } from 'zod';
import type { BonusUpdatePayload } from '../admin';

jest.mock('../client', () => ({
  apiClient: jest.fn(),
}));

const { apiClient } = jest.requireMock('../client') as {
  apiClient: jest.Mock;
};

describe('admin bonus api helpers', () => {
  beforeEach(() => {
    apiClient.mockReset();
    apiClient.mockResolvedValue({});
  });

  it('omits expiryDate when the payload uses an empty value', async () => {
    const { createBonus } = await import('../admin');

    const payload: BonusUpdatePayload = {
      name: 'Promo',
      type: 'deposit',
      description: 'desc',
      bonusPercent: 10,
      maxBonusUsd: 100,
      expiryDate: undefined,
      eligibility: 'all',
      status: 'active',
    };

    await createBonus(payload);

    expect(apiClient).toHaveBeenCalledTimes(1);

    const [path, , options] = apiClient.mock.calls[0] as [
      string,
      z.ZodTypeAny,
      { body: BonusUpdatePayload; method: string }?,
    ];

    expect(path).toBe('/api/admin/bonuses');
    expect(options?.method).toBe('POST');

    const serialized = JSON.parse(JSON.stringify(options?.body ?? {}));
    expect(serialized).not.toHaveProperty('expiryDate');
  });
});
