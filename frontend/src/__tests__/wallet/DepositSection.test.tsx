import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupCountdownTimers, setupClipboardMocks } from '../utils/wallet';

jest.mock('@/hooks/wallet', () => ({
  useIban: jest.fn(),
}));
import { useIban } from '@/hooks/wallet';
import DepositSection from '@/app/components/wallet/DepositSection';

const mockUseIban = useIban as jest.MockedFunction<typeof useIban>;

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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enables confirm after countdown and calls onConfirm', async () => {
    const onConfirm = jest.fn();
    const { unmount } = render(
      <DepositSection onClose={jest.fn()} onConfirm={onConfirm} />,
    );

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
    const { unmount } = render(
      <DepositSection onClose={jest.fn()} onConfirm={jest.fn()} />,
    );

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
    const { unmount } = render(
      <DepositSection onClose={jest.fn()} onConfirm={jest.fn()} />,
    );

    const acct = screen.getByText('DE02 5001 **** **** 1234');
    await userEvent.click(acct);

    expect(window.alert).toHaveBeenCalledWith('Failed to copy account number');

    unmount();
  });

  it('shows loading and error states', () => {
    mockUseIban.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    const { rerender } = render(
      <DepositSection onClose={jest.fn()} onConfirm={jest.fn()} />,
    );
    expect(screen.getByText(/loading iban/i)).toBeInTheDocument();

    mockUseIban.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'oops' },
    });
    rerender(<DepositSection onClose={jest.fn()} onConfirm={jest.fn()} />);
    expect(screen.getByText('oops')).toBeInTheDocument();
  });
});
