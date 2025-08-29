/** @jest-environment node */

import { getKycDenial } from '@/lib/api/kyc';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('kyc api', () => {
  it('gets denial reason', async () => {
    (serverFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ accountId: 'u1', reason: 'blocked' }),
    });
    await expect(getKycDenial('u1')).resolves.toEqual({
      accountId: 'u1',
      reason: 'blocked',
    });
  });
});
