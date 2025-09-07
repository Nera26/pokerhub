import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import BonusForm from '@/app/components/dashboard/forms/BonusForm';
import type { BonusFormValues } from '@/app/components/dashboard/BonusManager';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

describe('BonusForm', () => {
  function Wrapper() {
    const { register, formState: { errors } } = useForm<BonusFormValues>();
    return <BonusForm register={register} errors={errors} />;
  }

  it('renders fetched options', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        types: ['ticket'],
        eligibilities: ['vip'],
        statuses: ['paused'],
      },
      isLoading: false,
      error: null,
    });
    render(<Wrapper />);
    expect(screen.getByText('Tournament Tickets')).toBeInTheDocument();
    expect(screen.getByText('VIP Players Only')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('falls back to defaults on error', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'fail' },
    });
    render(<Wrapper />);
    expect(screen.getAllByText('Failed to load options')[0]).toBeInTheDocument();
    expect(screen.getByText('Deposit Match')).toBeInTheDocument();
    expect(screen.getByText('All Players')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
