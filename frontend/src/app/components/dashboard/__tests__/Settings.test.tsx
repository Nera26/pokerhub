import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Settings from '../Settings';
import { useChipDenominations } from '@/hooks/useChipDenominations';
import { updateChipDenominations } from '@/lib/api/config';

jest.mock('@/hooks/useChipDenominations');
jest.mock('@/lib/api/config');
jest.mock('@/hooks/useApiError', () => ({ useApiError: jest.fn() }));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  };
}

const useChipDenominationsMock = useChipDenominations as jest.Mock;
const updateChipDenominationsMock = updateChipDenominations as jest.Mock;

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    useChipDenominationsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithClient(<Settings />);

    expect(screen.getByText(/loading chip denominations/i)).toBeInTheDocument();
  });

  it('shows error state when query fails', () => {
    useChipDenominationsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    });

    renderWithClient(<Settings />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/failed to load chip denominations/i);
  });

  it('renders existing denominations in the form', async () => {
    useChipDenominationsMock.mockReturnValue({
      data: { denoms: [1000, 500, 100] },
      isLoading: false,
      error: null,
    });

    renderWithClient(<Settings />);

    const input = await screen.findByLabelText(/denominations/i);
    expect(input).toHaveValue('1000, 500, 100');
    expect(
      screen.getByText(/current order: 1000 • 500 • 100/i),
    ).toBeInTheDocument();
  });

  it('blocks submission for unsorted denominations', async () => {
    useChipDenominationsMock.mockReturnValue({
      data: { denoms: [1000, 500, 100] },
      isLoading: false,
      error: null,
    });

    renderWithClient(<Settings />);

    const input = await screen.findByLabelText(/denominations/i);
    fireEvent.change(input, { target: { value: '100, 500' } });
    fireEvent.click(
      screen.getByRole('button', { name: /save chip denominations/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /denominations must be positive integers sorted from largest to smallest/i,
        ),
      ).toBeInTheDocument();
    });

    expect(updateChipDenominationsMock).not.toHaveBeenCalled();
  });

  it('submits valid denominations and invalidates the query', async () => {
    useChipDenominationsMock.mockReturnValue({
      data: { denoms: [1000, 500, 100] },
      isLoading: false,
      error: null,
    });
    updateChipDenominationsMock.mockResolvedValue({
      denoms: [1000, 500, 100],
    });

    const { queryClient } = renderWithClient(<Settings />);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const input = await screen.findByLabelText(/denominations/i);
    fireEvent.change(input, { target: { value: '1000 500 100' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(updateChipDenominationsMock).toHaveBeenCalledWith([
        1000, 500, 100,
      ]);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['chip-denominations'],
      });
    });

    expect(screen.getByText(/chip denominations saved/i)).toBeInTheDocument();
  });
});
