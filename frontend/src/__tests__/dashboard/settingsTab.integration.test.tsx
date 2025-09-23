import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '@/app/dashboard/page';
import { useChipDenominations } from '@/hooks/useChipDenominations';
import { updateChipDenominations } from '@/lib/api/config';

const replace = jest.fn();
let searchParams = new URLSearchParams('tab=settings');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard',
  useSearchParams: () => searchParams,
}));

jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({ data: null, error: null, isLoading: false }),
}));

jest.mock('@/lib/api/profile', () => ({
  fetchProfile: jest.fn().mockResolvedValue({ avatarUrl: '/a.png' }),
}));

const fetchAdminTabsMock = jest.fn();

jest.mock('@/lib/api/admin', () => ({
  fetchAdminTabs: (...args: unknown[]) => fetchAdminTabsMock(...args),
  fetchAdminTabMeta: jest.fn(),
}));

jest.mock('@/lib/api/nav', () => ({
  fetchNavItems: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/components/dashboard/Sidebar', () => () => <div>Sidebar</div>);

jest.mock('@/hooks/useChipDenominations');
jest.mock('@/lib/api/config');
jest.mock('@/hooks/useApiError', () => ({ useApiError: jest.fn() }));

const useChipDenominationsMock = useChipDenominations as jest.Mock;
const updateChipDenominationsMock = updateChipDenominations as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return {
    client,
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  };
}

describe('settings tab integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchParams = new URLSearchParams('tab=settings');
    fetchAdminTabsMock.mockResolvedValue([
      {
        id: 'settings',
        title: 'Settings',
        component: '@/app/components/dashboard/Settings',
        source: 'config',
        icon: 'faCog',
      },
    ]);
    useChipDenominationsMock.mockReturnValue({
      data: { denoms: [1000, 500, 100] },
      isLoading: false,
      error: null,
    });
    updateChipDenominationsMock.mockResolvedValue({ denoms: [1000, 400, 100] });
  });

  it('submits updated chip denominations through the settings tab', async () => {
    const { client } = renderWithClient(<Page />);
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const input = await screen.findByLabelText(
      /denominations/i,
      {},
      {
        timeout: 5000,
      },
    );

    fireEvent.change(input, { target: { value: '1000 400 100' } });
    fireEvent.click(
      await screen.findByRole('button', { name: /save chip denominations/i }),
    );

    await waitFor(() => {
      expect(updateChipDenominationsMock).toHaveBeenCalledWith([
        1000, 400, 100,
      ]);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['chip-denominations'],
      });
    });

    expect(
      await screen.findByText(
        /chip denominations saved/i,
        {},
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });
});
