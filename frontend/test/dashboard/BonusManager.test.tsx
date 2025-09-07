import { render, screen, fireEvent } from '@testing-library/react';
import BonusManager from '@/app/components/dashboard/BonusManager';
import { useQuery } from '@tanstack/react-query';
import useBonusMutation from '@/hooks/useBonusMutation';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('@/hooks/useBonusMutation');

describe('BonusManager component', () => {
  beforeEach(() => {
    (useBonusMutation as jest.Mock).mockReturnValue({ mutate: jest.fn() });
    (useQuery as jest.Mock).mockReset();
  });

  it('renders bonuses on successful fetch', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          name: 'Test Bonus',
          type: 'deposit',
          description: 'desc',
          eligibility: 'all',
          status: 'active',
          claimsTotal: 0,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<BonusManager />);
    expect(screen.getByText('Test Bonus')).toBeInTheDocument();
  });

  it('shows error message on fetch failure', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: { message: 'fail' },
    });
    render(<BonusManager />);
    expect(screen.getByRole('alert')).toHaveTextContent('fail');
  });

  it('renders form fields for create and edit using BonusForm', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          name: 'Edit Bonus',
          type: 'deposit',
          description: 'desc',
          eligibility: 'all',
          status: 'active',
          claimsTotal: 0,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<BonusManager />);

    const createInput = screen.getAllByPlaceholderText('Enter promotion name...')[0];
    expect(createInput).toHaveValue('');

    fireEvent.click(screen.getByText('Edit'));
    const editInput = screen.getAllByPlaceholderText('Enter promotion name...')[1];
    expect(editInput).toHaveValue('Edit Bonus');
  });
});

