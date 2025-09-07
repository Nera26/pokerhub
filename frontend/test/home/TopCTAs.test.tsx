import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TopCTAs from '@/app/components/home/TopCTAs';
import { fetchCTAs } from '@/lib/api/lobby';

jest.mock('@/lib/api/lobby', () => ({
  fetchCTAs: jest.fn(),
}));

const mockFetchCTAs = fetchCTAs as jest.MockedFunction<typeof fetchCTAs>;

function renderWithClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TopCTAs />
    </QueryClientProvider>,
  );
}

describe('TopCTAs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders CTAs from API', async () => {
    mockFetchCTAs.mockResolvedValueOnce([
      {
        id: 'join-table',
        label: 'Join a Live Table',
        href: '#cash-games-panel',
        variant: 'primary',
      },
      {
        id: 'view-tournaments',
        label: 'View Tournaments',
        href: '#tournaments-panel',
        variant: 'outline',
      },
    ]);

    renderWithClient();

    expect(
      await screen.findByRole('button', { name: /join a live table/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /view tournaments/i }),
    ).toBeInTheDocument();
  });
});
