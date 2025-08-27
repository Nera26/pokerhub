import { render, screen } from '@testing-library/react';
import NotFound from '../app/not-found';

describe('NotFound navigation accessibility', () => {
  it('nav buttons have accessible names', () => {
    render(<NotFound />);
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /wallet balance/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Promotions' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Leaderboard' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Notifications' }),
    ).toBeInTheDocument();
  });
});
