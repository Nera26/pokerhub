import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '@/app/components/ui/Modal';

describe('Modal', () => {
  it('renders content when open and calls onClose on overlay click', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>modal content</p>
      </Modal>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    await userEvent.click(dialog.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('focuses dialog and keeps tab navigation inside', async () => {
    const onClose = jest.fn();
    render(
      <div>
        <button>before</button>
        <Modal isOpen onClose={onClose}>
          <button>inside</button>
        </Modal>
      </div>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveFocus();
    await userEvent.tab();
    const inside = screen.getByRole('button', { name: 'inside' });
    expect(inside).toHaveFocus();
  });

  it('invokes onClose when ESC key is pressed', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        content
      </Modal>,
    );
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
