import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import UserForm from '../UserForm';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

const onSubmit = jest.fn();
const onCancel = jest.fn();

describe('UserForm', () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReset();
  });

  it('renders role and status options from API meta', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        roles: [{ value: 'Player', label: 'Player' }],
        statuses: [{ value: 'Active', label: 'Active' }],
      },
      isLoading: false,
      error: null,
    });

    render(
      <UserForm
        submitLabel="Submit"
        onSubmit={onSubmit}
        onCancel={onCancel}
        showRole
      />,
    );

    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <UserForm submitLabel="Submit" onSubmit={onSubmit} onCancel={onCancel} />,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error message when API fails', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      error: { message: 'fail' },
      isLoading: false,
    });

    render(
      <UserForm submitLabel="Submit" onSubmit={onSubmit} onCancel={onCancel} />,
    );

    expect(screen.getByText('Failed to load user options')).toBeInTheDocument();
  });
});
