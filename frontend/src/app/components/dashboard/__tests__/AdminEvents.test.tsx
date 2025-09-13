import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminEvents from '../AdminEvents';
import { useAdminEvents } from '@/hooks/admin';
import { acknowledgeAdminEvent } from '@/lib/api/admin';
import React from 'react';

jest.mock('@/hooks/admin', () => ({
  useAdminEvents: jest.fn(),
}));

jest.mock('@/lib/api/admin', () => ({
  acknowledgeAdminEvent: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rendered = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
  return { ...rendered, queryClient };
}

import { render } from '@testing-library/react';

describe('AdminEvents', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    (useAdminEvents as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    renderWithClient(<AdminEvents />);
    expect(screen.getByText(/loading events/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useAdminEvents as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('x'),
    });
    renderWithClient(<AdminEvents />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /failed to load events/i,
    );
  });

  it('shows empty state', () => {
    (useAdminEvents as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    renderWithClient(<AdminEvents />);
    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });

  it('acknowledges events and invalidates query', async () => {
    (useAdminEvents as jest.Mock).mockReturnValue({
      data: [{ id: '1', title: 't', description: 'd', date: '2024-01-01' }],
      isLoading: false,
      error: null,
    });
    (acknowledgeAdminEvent as jest.Mock).mockResolvedValue({});

    const { queryClient } = renderWithClient(<AdminEvents />);
    const spy = jest.spyOn(queryClient, 'invalidateQueries');

    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));

    await waitFor(() => {
      expect(acknowledgeAdminEvent).toHaveBeenCalledWith('1');
      expect(spy).toHaveBeenCalledWith({ queryKey: ['admin-events'] });
    });
  });
});
