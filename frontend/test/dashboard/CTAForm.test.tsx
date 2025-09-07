import type React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CTAForm from '@/app/components/dashboard/CTAForm';
import { createCTA, updateCTA } from '@/lib/api/lobby';

jest.mock('@/lib/api/lobby', () => ({
  createCTA: jest.fn(),
  updateCTA: jest.fn(),
}));

function renderForm(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('CTAForm', () => {
  const user = userEvent.setup();

  it('submits new CTA', async () => {
    (createCTA as jest.Mock).mockResolvedValue({
      id: 'cta1',
      label: 'Join',
      href: '/join',
      variant: 'primary',
    });
    renderForm(<CTAForm />);
    await user.type(screen.getByLabelText(/id/i), 'cta1');
    await user.type(screen.getByLabelText(/label/i), 'Join');
    await user.type(screen.getByLabelText(/href/i), '/join');
    await user.selectOptions(screen.getByLabelText(/variant/i), 'primary');
    await user.click(screen.getByRole('button', { name: /save cta/i }));
    await waitFor(() =>
      expect(createCTA).toHaveBeenCalledWith({
        id: 'cta1',
        label: 'Join',
        href: '/join',
        variant: 'primary',
      }),
    );
  });

  it('updates existing CTA', async () => {
    (updateCTA as jest.Mock).mockResolvedValue({
      id: 'cta1',
      label: 'Updated',
      href: '/join',
      variant: 'primary',
    });
    renderForm(
      <CTAForm cta={{ id: 'cta1', label: 'Join', href: '/join', variant: 'primary' }} />,
    );
    await user.clear(screen.getByLabelText(/label/i));
    await user.type(screen.getByLabelText(/label/i), 'Updated');
    await user.click(screen.getByRole('button', { name: /save cta/i }));
    await waitFor(() =>
      expect(updateCTA).toHaveBeenCalledWith('cta1', {
        id: 'cta1',
        label: 'Updated',
        href: '/join',
        variant: 'primary',
      }),
    );
  });
});

