import { useState } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal', () => {
  function Wrapper() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open Modal</button>
        <ConfirmModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  }

  it('traps focus within the modal', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole('button', { name: 'Open Modal' }));
    const first = await screen.findByRole('button', { name: 'Confirm' });
    const second = screen.getByRole('button', { name: 'Cancel' });
    const opener = screen.getByRole('button', { name: 'Open Modal' });

    await user.tab();
    expect(first).toHaveFocus();
    await user.tab();
    expect(second).toHaveFocus();
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab({ shift: true });
    expect(second).toHaveFocus();
    expect(opener).not.toHaveFocus();
  });

  it('closes on Escape and returns focus to opener', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<Wrapper />);
    const openBtn = screen.getByRole('button', { name: 'Open Modal' });
    await user.click(openBtn);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    act(() => {
      jest.runAllTimers();
    });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(openBtn).toHaveFocus();
    jest.useRealTimers();
  });
});
