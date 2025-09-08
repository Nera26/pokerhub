import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PromotionsPage from '@/features/site/promotions';
import { fetchPromotions } from '@/lib/api/promotions';
import type { Promotion } from '@shared/types';

jest.mock('@/lib/api/promotions', () => ({
  fetchPromotions: jest.fn(),
}));

describe('PromotionsPage', () => {
  const mockFetchPromotions =
    fetchPromotions as jest.MockedFunction<typeof fetchPromotions>;

  function renderWithClient() {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={client}>
        <PromotionsPage />
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    mockFetchPromotions.mockReset();
  });

  it('shows loading skeleton', () => {
    mockFetchPromotions.mockReturnValue(
      new Promise<Promotion[]>(() => {}),
    );
    renderWithClient();
    expect(screen.getByTestId('promotions-loading')).toBeInTheDocument();
  });

  it('shows error message on failure', async () => {
    mockFetchPromotions.mockRejectedValue(new Error('fail'));
    renderWithClient();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /error loading promotions/i,
      ),
    );
  });

  it('renders empty state when no promotions', async () => {
    mockFetchPromotions.mockResolvedValue([]);
    renderWithClient();
    await waitFor(() =>
      expect(screen.getByText(/no promotions/i)).toBeInTheDocument(),
    );
  });

  it('renders promotions on success', async () => {
    const promotion: Promotion = {
      id: '1',
      category: 'daily',
      title: 'Promo',
      description: 'desc',
      reward: 'reward',
      unlockText: 'unlock',
      breakdown: [],
    };
    mockFetchPromotions.mockResolvedValue([promotion]);
    renderWithClient();
    await waitFor(() =>
      expect(screen.getByText('Promo')).toBeInTheDocument(),
    );
  });
});
