import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '@/app/components/ui/Modal';

describe('Modal accessibility', () => {
  it('cycles focus with Tab and Shift+Tab', async () => {
    render(
      <div>
        <button>before</button>
        <Modal isOpen onClose={() => {}}>
          <button>first</button>
          <button>last</button>
        </Modal>
        <button>after</button>
      </div>,
    );

    const first = screen.getByRole('button', { name: 'first' });
    const last = screen.getByRole('button', { name: 'last' });

    // dialog -> first
    await userEvent.tab();
    expect(first).toHaveFocus();

    // first -> last
    await userEvent.tab();
    expect(last).toHaveFocus();

    // last -> first
    await userEvent.tab();
    expect(first).toHaveFocus();

    // first -> last (shift+tab)
    await userEvent.tab({ shift: true });
    expect(last).toHaveFocus();

    // last -> first (shift+tab)
    await userEvent.tab({ shift: true });
    expect(first).toHaveFocus();
  });
});
