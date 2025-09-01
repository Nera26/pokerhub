import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationDropdown from '@/app/components/common/header/NotificationDropdown';
import axe from 'axe-core';

describe('NotificationDropdown', () => {
  function setup() {
    render(
      <div>
        <NotificationDropdown
          notifications={[
            {
              id: '1',
              type: 'system',
              title: 'First',
              message: '',
              timestamp: new Date(),
              read: false,
            },
          ]}
        />
        <button>outside</button>
      </div>,
    );
  }

  it('closes with Esc key and restores focus', async () => {
    setup();
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /notifications/i });
    await user.click(trigger);
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it('closes when tabbing out and restores focus', async () => {
    setup();
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /notifications/i });
    await user.click(trigger);
    await screen.findByRole('menu');
    await user.tab(); // move to View all link
    await user.tab(); // tab out
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking outside', async () => {
    setup();
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /notifications/i });
    const outside = screen.getByRole('button', { name: 'outside' });
    await user.click(trigger);
    await screen.findByRole('menu');
    await user.click(outside);
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<NotificationDropdown notifications={[]} />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('moves focus between items with arrow keys', async () => {
    render(
      <NotificationDropdown
        notifications={[
          {
            id: '1',
            type: 'system',
            title: 'First',
            message: '',
            timestamp: new Date(),
            read: false,
          },
          {
            id: '2',
            type: 'system',
            title: 'Second',
            message: '',
            timestamp: new Date(),
            read: false,
          },
        ]}
      />,
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /notifications/i });
    await user.click(trigger);
    const items = await screen.findAllByRole('menuitem');
    expect(items[0]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(items[0]).toHaveFocus();
  });
});
