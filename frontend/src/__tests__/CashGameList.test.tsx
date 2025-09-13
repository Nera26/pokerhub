import { render, screen } from '@testing-library/react';
import CashGameList from '@/app/components/home/CashGameList';
import type { Table } from '@/hooks/useLobbyData';

describe('CashGameList', () => {
  it('renders via VirtualizedList', () => {
    const tables: Table[] = [];
    render(<CashGameList tables={tables} gameType="texas" hidden={false} />);
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('id', 'cash-games-panel');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-texas');
    expect(screen.getByText('No cash games available.')).toBeInTheDocument();
  });
});
