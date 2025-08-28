/** @jest-environment node */
import { checkApiContractVersion } from '@/lib/api/client';
import { API_CONTRACT_VERSION } from '@shared/constants';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => '' }));
jest.mock('@/lib/server-fetch', () => ({ serverFetch: jest.fn() }));

const mockedServerFetch = serverFetch as jest.Mock;

describe('checkApiContractVersion', () => {
  beforeEach(() => {
    mockedServerFetch.mockReset();
  });

  it('throws on mismatched major version', async () => {
    mockedServerFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ status: 'ok', contractVersion: '2.0.0' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await expect(checkApiContractVersion()).rejects.toThrow(
      'API contract version mismatch',
    );
  });

  it('resolves when major versions match', async () => {
    mockedServerFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'ok',
          contractVersion: API_CONTRACT_VERSION,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await expect(checkApiContractVersion()).resolves.toBeUndefined();
  });
});
