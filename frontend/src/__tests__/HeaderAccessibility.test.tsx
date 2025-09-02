import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '@/app/components/common/header/Header';
import type { ResponseLike } from '@/lib/api/client';
import { AuthProvider } from '@/context/AuthContext';

describe('header notifications accessibility', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('focuses first item and closes on tab out', async () => {
    const fetchMock = jest
      .fn<Promise<ResponseLike>, [RequestInfo | URL, RequestInit?]>()
      .mockImplementation(async (input: RequestInfo | URL) => {
        const url =
          typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('/api/notifications')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              notifications: [
                {
                  id: '1',
                  type: 'system',
                  title: 'First',
                  message: '',
                  timestamp: new Date().toISOString(),
                  read: false,
                },
              ],
            }),
          } as ResponseLike;
        }
        if (url.includes('/api/wallet/u1/status')) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              kycVerified: true,
              denialReason: null,
              realBalance: 10000,
              creditBalance: 0,
            }),
          } as ResponseLike;
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({}),
        } as ResponseLike;
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new QueryClient();
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={client}>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await screen.findByRole('link', { name: /wallet/i });

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const firstItem = await screen.findByRole('menuitem');
    expect(firstItem).toHaveFocus();

    await user.tab();
    const viewAll = screen.getByRole('link', { name: /view all/i });
    expect(viewAll).toHaveFocus();

    await user.tab();
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
  });
});
