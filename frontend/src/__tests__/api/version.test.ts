/** @jest-environment node */
import { checkApiContractVersion } from '@/lib/api/client';
import { API_CONTRACT_VERSION } from '@shared/constants';

jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => '' }));

const mockedFetch = fetch as jest.Mock;

describe('checkApiContractVersion', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('throws on mismatched major version', async () => {
    mockedFetch.mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok', contractVersion: '3.0.0' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(checkApiContractVersion()).rejects.toThrow(
      'API contract version mismatch',
    );
  });

  it('resolves when major versions match', async () => {
    mockedFetch.mockResolvedValue(
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
