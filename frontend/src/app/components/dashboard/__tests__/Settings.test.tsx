import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Settings from '../Settings';
import { useChipDenominations } from '@/hooks/useChipDenominations';
import { usePerformanceThresholds } from '@/hooks/usePerformanceThresholds';
import {
  updateChipDenominations,
  updatePerformanceThresholds,
} from '@/lib/api/config';

jest.mock('@/hooks/useChipDenominations');
jest.mock('@/hooks/usePerformanceThresholds');
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
const usePerformanceThresholdsMock = usePerformanceThresholds as jest.Mock;
const updateChipDenominationsMock = updateChipDenominations as jest.Mock;
const updatePerformanceThresholdsMock =
  updatePerformanceThresholds as jest.Mock;

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePerformanceThresholdsMock.mockReturnValue({
      data: { INP: 150, LCP: 2500, CLS: 0.05 },
      isLoading: false,
      error: null,
    });
    updatePerformanceThresholdsMock.mockResolvedValue({
      INP: 150,
      LCP: 2500,
      CLS: 0.05,
    });
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

  it('shows loading state for thresholds', () => {
    useChipDenominationsMock.mockReturnValue({
      data: { denoms: [1000, 500, 100] },
      isLoading: false,
      error: null,
    });
    usePerformanceThresholdsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithClient(<Settings />);

    expect(
      screen.getByText(/loading performance thresholds/i),
    ).toBeInTheDocument();
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

  it('shows error state when thresholds query fails', () => {
    usePerformanceThresholdsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('nope'),
    });

    renderWithClient(<Settings />);

    expect(
      screen.getByText(/failed to load performance thresholds/i),
    ).toBeInTheDocument();
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

  it('prefills performance threshold values', async () => {
    usePerformanceThresholdsMock.mockReturnValue({
      data: { INP: 120, LCP: 2200, CLS: 0.09 },
      isLoading: false,
      error: null,
    });

    renderWithClient(<Settings />);

    expect(
      await screen.findByLabelText(/interaction to next paint/i),
    ).toHaveValue(120);
    expect(screen.getByLabelText(/largest contentful paint/i)).toHaveValue(
      2200,
    );
    expect(screen.getByLabelText(/cumulative layout shift/i)).toHaveValue(0.09);
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

  it('validates performance thresholds before submitting', async () => {
    renderWithClient(<Settings />);

    const clsInput = await screen.findByLabelText(/cumulative layout shift/i);
    fireEvent.change(clsInput, { target: { value: '1.5' } });
    const form = clsInput.closest('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText(/cumulative layout shift.*at most 1/i),
      ).toBeInTheDocument();
    });

    expect(updatePerformanceThresholdsMock).not.toHaveBeenCalled();
  });

  it('submits updated performance thresholds', async () => {
    updatePerformanceThresholdsMock.mockResolvedValueOnce({
      INP: 140,
      LCP: 2500,
      CLS: 0.05,
    });
    const { queryClient } = renderWithClient(<Settings />);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

    const inpInput = await screen.findByLabelText(/interaction to next paint/i);
    fireEvent.change(inpInput, { target: { value: '140' } });

    const form = inpInput.closest('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(updatePerformanceThresholdsMock).toHaveBeenCalledWith({
        INP: 140,
        LCP: 2500,
        CLS: 0.05,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['performance-thresholds'],
      });
      expect(setQueryDataSpy).toHaveBeenCalledWith(['performance-thresholds'], {
        INP: 140,
        LCP: 2500,
        CLS: 0.05,
      });
    });

    expect(
      screen.getByText(/performance thresholds saved/i),
    ).toBeInTheDocument();
  });
});
