import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderDepositSection,
  setupCountdownTimers,
  setupClipboardMocks,
} from './helpers';

jest.mock('@/hooks/wallet', () => ({
  useIban: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));
import { useIban } from '@/hooks/wallet';
import { useQuery } from '@tanstack/react-query';

const mockUseIban = useIban as jest.MockedFunction<typeof useIban>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('DepositSection', () => {
  let advanceTimers: (ticks: number) => void;
  let writeTextMock: jest.Mock<Promise<void>, [string]>;

  beforeEach(() => {
    advanceTimers = setupCountdownTimers();
    writeTextMock = setupClipboardMocks();
    mockUseIban.mockReturnValue({
      data: {
        iban: 'DE02 5001 0517 5407 4100 72',
        masked: 'DE02 5001 **** **** 1234',
        holder: '',
        instructions: '',
        updatedBy: '',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      isLoading: false,
      error: null,
    });
    mockUseQuery.mockReturnValue({
      data: {
        name: 'Trade & Trust Bank',
        accountName: 'PokerHub LLC',
        address: 'Bayanzurkh District, Ulaanbaatar',
        masked: 'DE02 5001 **** **** 1234',
      },
      isLoading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enables confirm after countdown and calls onConfirm', async () => {
    const onConfirm = jest.fn();
    const { unmount } = renderDepositSection({ onConfirm });

    const waitingButton = screen.getByRole('button', { name: /waiting 10s/i });
    expect(waitingButton).toBeDisabled();

    act(() => {
      advanceTimers(10);
    });

    const confirmCheckbox = screen.getByRole('checkbox', {
      name: /i confirm that i have sent the deposit/i,
    });
    await userEvent.click(confirmCheckbox);

    const confirmButton = screen.getByRole('button', {
      name: /i've sent the deposit/i,
    });
    expect(confirmButton).toBeEnabled();
    await userEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalled();

    unmount();
  });

  it('copies account number to clipboard and alerts success', async () => {
    const { unmount } = renderDepositSection();

    const acct = screen.getByText('DE02 5001 **** **** 1234');
    await userEvent.click(acct);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'DE02 5001 0517 5407 4100 72',
    );
    expect(window.alert).toHaveBeenCalledWith(
      'Account number copied to clipboard',
    );

    unmount();
  });

  it('alerts when clipboard copy fails', async () => {
    writeTextMock.mockRejectedValueOnce(new Error('fail'));
    const { unmount } = renderDepositSection();

    const acct = screen.getByText('DE02 5001 **** **** 1234');
    await userEvent.click(acct);

    expect(window.alert).toHaveBeenCalledWith('Failed to copy account number');

    unmount();
  });

  it('shows loading and error states', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);
    const { rerender } = renderDepositSection();
    expect(screen.getByText(/loading bank details/i)).toBeInTheDocument();

    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'bank oops' },
    } as any);
    rerender();
    expect(screen.getByText('bank oops')).toBeInTheDocument();

    mockUseIban.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    rerender();
    expect(screen.getByText(/loading iban/i)).toBeInTheDocument();

    mockUseIban.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'oops' },
    });
    rerender();
    expect(screen.getByText('oops')).toBeInTheDocument();
  });
});
