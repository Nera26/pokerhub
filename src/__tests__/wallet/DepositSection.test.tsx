import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DepositSection from '@/app/components/wallet/DepositSection';

describe('DepositSection', () => {
  let intervalCb: (() => void) | undefined;

  beforeEach(() => {
    intervalCb = undefined;
    jest.spyOn(window, 'setInterval').mockImplementation(((
      cb: TimerHandler,
    ) => {
      intervalCb = cb as () => void;
      return 1;
    }) as unknown as typeof setInterval);
    jest.spyOn(window, 'clearInterval').mockImplementation(() => {});
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });
    jest.spyOn(window, 'alert').mockImplementation(() => {});
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
      for (let i = 0; i < 10; i++) intervalCb && intervalCb();
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

    const acct = screen.getByText('1234 5678 9101 1121');
    await userEvent.click(acct);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      '1234 5678 9101 1121',
    );
    expect(window.alert).toHaveBeenCalledWith(
      'Account number copied to clipboard',
    );

    unmount();
  });

  it('alerts when clipboard copy fails', async () => {
    const clipboard = (
      navigator.clipboard as unknown as {
        writeText: jest.Mock<Promise<void>, [string]>;
      }
    ).writeText;
    clipboard.mockRejectedValueOnce(new Error('fail'));
    const { unmount } = render(
      <DepositSection onClose={jest.fn()} onConfirm={jest.fn()} />,
    );

    const acct = screen.getByText('1234 5678 9101 1121');
    await userEvent.click(acct);

    expect(window.alert).toHaveBeenCalledWith('Failed to copy account number');

    unmount();
  });
});
