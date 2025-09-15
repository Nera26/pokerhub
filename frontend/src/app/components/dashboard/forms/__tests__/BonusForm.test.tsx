import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import BonusForm from '../BonusForm';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

const register = jest.fn(() => ({}));

describe('BonusForm', () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReset();
  });

  it('renders labels from API options', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        types: [{ value: 'deposit', label: 'Deposit Match' }],
        eligibilities: [{ value: 'all', label: 'All Players' }],
        statuses: [{ value: 'active', label: 'Active' }],
      },
      error: null,
    });

    render(<BonusForm register={register} errors={{}} />);

    expect(screen.getByText('Deposit Match')).toBeInTheDocument();
    expect(screen.getByText('All Players')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows error message when API fails', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      error: { message: 'fail' },
    });

    render(<BonusForm register={register} errors={{}} />);

    expect(
      screen.getByText('Failed to load bonus options'),
    ).toBeInTheDocument();
  });

  it('applies defaults and displays field errors', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        types: [{ value: 'deposit', label: 'Deposit Match' }],
        eligibilities: [{ value: 'all', label: 'All Players' }],
        statuses: [{ value: 'active', label: 'Active' }],
      },
      error: null,
    });

    render(
      <BonusForm
        register={register}
        errors={{
          description: { message: 'Required' },
          type: { message: 'Type required' },
        }}
        defaults={{
          description: 'Default desc',
          name: 'Promo',
          type: 'deposit',
        }}
      />,
    );

    expect(screen.getByDisplayValue('Promo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Default desc')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Type required')).toBeInTheDocument();
  });
});
