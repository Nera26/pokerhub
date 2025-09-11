import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import BonusForm from '@/app/components/dashboard/forms/BonusForm';
import type { BonusFormValues } from '@/app/components/dashboard/BonusManager';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

describe('BonusForm', () => {
  function Wrapper() {
    const {
      register,
      formState: { errors },
    } = useForm<BonusFormValues>();
    return <BonusForm register={register} errors={errors} />;
  }

  it('renders fetched options', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        types: [{ value: 'ticket', label: 'Tournament Tickets' }],
        eligibilities: [{ value: 'vip', label: 'VIP Players Only' }],
        statuses: [{ value: 'paused', label: 'Paused' }],
      },
      isLoading: false,
      error: null,
    });
    render(<Wrapper />);
    expect(screen.getByText('Tournament Tickets')).toBeInTheDocument();
    expect(screen.getByText('VIP Players Only')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('shows error message when options fail to load', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'fail' },
    });
    render(<Wrapper />);
    expect(
      screen.getByText('Failed to load bonus options'),
    ).toBeInTheDocument();
  });
});
