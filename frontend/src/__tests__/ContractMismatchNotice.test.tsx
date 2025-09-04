import { render, screen } from '@testing-library/react';
import ContractMismatchNotice from '@/components/ContractMismatchNotice';
import { checkApiContractVersion } from '@/lib/api/client';

jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => 'http://example.com' }));

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: () =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => ({ status: 'ok', contractVersion: '99.0.0' }),
    }),
}));

describe('ContractMismatchNotice', () => {
  it('shows notice when contract versions mismatch', async () => {
    render(<ContractMismatchNotice />);
    await expect(checkApiContractVersion()).rejects.toThrow(
      'API contract version mismatch',
    );
    expect(
      await screen.findByText(/please refresh the page/i),
    ).toBeInTheDocument();
  });
});
