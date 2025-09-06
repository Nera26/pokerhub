import { render, screen } from '@testing-library/react';
import BonusManager from '@/app/components/dashboard/BonusManager';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');

describe('BonusManager component', () => {
  beforeEach(() => {
    (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn() });
    (useQueryClient as jest.Mock).mockReturnValue({
      cancelQueries: jest.fn(),
      getQueryData: jest.fn(),
      setQueryData: jest.fn(),
      invalidateQueries: jest.fn(),
    });
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

  it('optimistically updates bonuses', async () => {
    const setQueryData = jest.fn();
    (useQueryClient as jest.Mock).mockReturnValue({
      cancelQueries: jest.fn(),
      getQueryData: jest
        .fn()
        .mockReturnValue([
          {
            id: 1,
            name: 'Test Bonus',
            type: 'deposit',
            description: 'desc',
            eligibility: 'all',
            status: 'active',
            claimsTotal: 0,
          },
        ]),
      setQueryData,
      invalidateQueries: jest.fn(),
    });
    const mutationCalls: any[] = [];
    (useMutation as jest.Mock).mockImplementation((opts) => {
      mutationCalls.push(opts);
      return { mutate: jest.fn() };
    });
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<BonusManager />);
    const updateOpts = mutationCalls[1];
    await updateOpts.onMutate({ id: 1, data: { status: 'paused' } });
    expect(setQueryData).toHaveBeenCalledWith(['admin-bonuses'], [
      {
        id: 1,
        name: 'Test Bonus',
        type: 'deposit',
        description: 'desc',
        eligibility: 'all',
        status: 'paused',
        claimsTotal: 0,
      },
    ]);
  });
});
