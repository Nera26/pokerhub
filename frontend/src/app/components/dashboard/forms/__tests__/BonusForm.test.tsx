import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import BonusForm from '../BonusForm';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

const register = jest.fn(() => ({}));

const mockOptions = {
  types: [{ value: 'deposit', label: 'Deposit Match' }],
  eligibilities: [{ value: 'all', label: 'All Players' }],
  statuses: [{ value: 'active', label: 'Active' }],
};

function renderBonusForm(
  queryOverrides: Partial<{ data: unknown; error: unknown }> = {},
  props: Record<string, unknown> = {},
) {
  (useQuery as jest.Mock).mockReturnValue({
    data: mockOptions,
    error: null,
    ...queryOverrides,
  });

  return render(<BonusForm register={register} errors={{}} {...props} />);
}

describe('BonusForm', () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReset();
  });

  it('renders labels from API options', () => {
    renderBonusForm();

    expect(screen.getByText('Deposit Match')).toBeInTheDocument();
    expect(screen.getByText('All Players')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows error message when API fails', () => {
    renderBonusForm({ data: undefined, error: { message: 'fail' } });

    expect(
      screen.getByText('Failed to load bonus options'),
    ).toBeInTheDocument();
  });

  it('applies defaults and displays field errors', () => {
    renderBonusForm({}, {
      errors: {
        description: { message: 'Required' } as any,
        type: { message: 'Type required' } as any,
      },
      defaults: {
        description: 'Default desc',
        name: 'Promo',
        type: 'deposit',
      },
    });

    expect(screen.getByDisplayValue('Promo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Default desc')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Type required')).toBeInTheDocument();
  });
});
