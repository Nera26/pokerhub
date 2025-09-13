import { render, screen } from '@testing-library/react';
import TablePage from '@/features/table';
import { useTables } from '@/hooks/useLobbyData';

jest.mock('@/hooks/useLobbyData');

describe('TablePage skeleton', () => {
  it('renders SkeletonGrid while loading', () => {
    (useTables as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isLoading: true,
    });
    render(<TablePage />);
    expect(screen.getAllByLabelText('Loading table')).toHaveLength(6);
  });
});
