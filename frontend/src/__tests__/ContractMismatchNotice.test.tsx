import { render, screen } from '@testing-library/react';
import ContractMismatchNotice from '@/components/ContractMismatchNotice';
import { checkApiContractVersion } from '@/lib/api/client';

jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => 'http://example.com' }));

const mockedFetch = fetch as jest.Mock;

describe('ContractMismatchNotice', () => {
  it('shows notice when contract versions mismatch', async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' },
      json: async () => ({ status: 'ok', contractVersion: '99.0.0' }),
    });
    render(<ContractMismatchNotice />);
    await expect(checkApiContractVersion()).rejects.toThrow(
      'API contract version mismatch',
    );
    expect(
      await screen.findByText(/please refresh the page/i),
    ).toBeInTheDocument();
  });
});
