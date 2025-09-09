import { render, screen, fireEvent } from '@testing-library/react';
import NotificationItem from '@/app/components/notifications/NotificationItem';

describe('NotificationItem', () => {
  const notification = {
    id: '1',
    type: 'bonus' as const,
    title: 'Bonus Unlocked',
    message: 'You have received a bonus!',
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    read: false,
  };

  it('displays notification content', () => {
    render(<NotificationItem notification={notification} />);
    expect(screen.getByText('Bonus Unlocked')).toBeInTheDocument();
    expect(screen.getByText('You have received a bonus!')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<NotificationItem notification={notification} onClick={onClick} />);
    fireEvent.click(screen.getByText('Bonus Unlocked'));
    expect(onClick).toHaveBeenCalledWith('1');
  });
});
