import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import AdminBankReconciliation from '../AdminBankReconciliation';
import { reconcileDeposits } from '@/lib/api/wallet';

jest.mock('@/hooks/useRequireAdmin', () => ({
  useRequireAdmin: jest.fn(),
}));

const pushToast = jest.fn();

jest.mock('@/hooks/useToasts', () => () => ({
  toasts: [],
  pushToast,
}));

jest.mock('@/lib/api/wallet', () => ({
  reconcileDeposits: jest.fn(),
}));

jest.mock('@/app/components/ui/ToastNotification', () => ({
  __esModule: true,
  default: ({ message }: { message: string }) => (
    <div data-testid="toast">{message}</div>
  ),
}));

describe('AdminBankReconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pushToast.mockClear();
    (reconcileDeposits as jest.Mock).mockReset();
    (reconcileDeposits as jest.Mock).mockResolvedValue({
      message: 'reconciled',
    });
  });

  it('submits manual entries successfully', async () => {
    renderWithClient(<AdminBankReconciliation />);

    fireEvent.change(screen.getByLabelText('Deposit reference'), {
      target: { value: 'ABC123' },
    });
    fireEvent.change(screen.getByLabelText('Amount (cents)'), {
      target: { value: '5000' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Submit reconciliation' }),
    );

    await waitFor(() => {
      expect(reconcileDeposits).toHaveBeenCalledWith({
        entries: [{ reference: 'ABC123', amount: 5000 }],
      });
    });

    await waitFor(() =>
      expect(screen.getByLabelText('Deposit reference')).toHaveValue(''),
    );
    expect(pushToast).toHaveBeenCalledWith('reconciled', {
      variant: 'success',
    });
  });

  it('shows validation error when no entries provided', async () => {
    renderWithClient(<AdminBankReconciliation />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Submit reconciliation' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Add at least one entry or upload a CSV file.',
    );
    expect(reconcileDeposits).not.toHaveBeenCalled();
  });

  it('validates amount must be positive integer', async () => {
    renderWithClient(<AdminBankReconciliation />);

    fireEvent.change(screen.getByLabelText('Deposit reference'), {
      target: { value: 'REF' },
    });
    fireEvent.change(screen.getByLabelText('Amount (cents)'), {
      target: { value: '0' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Submit reconciliation' }),
    );

    expect(
      await screen.findByText('Amount must be a positive integer'),
    ).toBeInTheDocument();
    expect(reconcileDeposits).not.toHaveBeenCalled();
  });

  it('submits uploaded CSV file', async () => {
    renderWithClient(<AdminBankReconciliation />);

    const fileInput = screen.getByLabelText('CSV file') as HTMLInputElement;
    const file = new File(['reference,amount\nabc,100\n'], 'recon.csv', {
      type: 'text/csv',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(
      screen.getByRole('button', { name: 'Submit reconciliation' }),
    );

    await waitFor(() => {
      expect(reconcileDeposits).toHaveBeenCalledWith({ file });
    });
    expect(pushToast).toHaveBeenCalledWith('reconciled', {
      variant: 'success',
    });
    await waitFor(() => expect(fileInput.value).toBe(''));
  });

  it('shows error toast when API request fails', async () => {
    (reconcileDeposits as jest.Mock).mockRejectedValue(
      new Error('server down'),
    );
    renderWithClient(<AdminBankReconciliation />);

    fireEvent.change(screen.getByLabelText('Deposit reference'), {
      target: { value: 'ERR' },
    });
    fireEvent.change(screen.getByLabelText('Amount (cents)'), {
      target: { value: '100' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Submit reconciliation' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to reconcile deposits: server down',
    );
    expect(pushToast).toHaveBeenCalledWith(
      'Failed to reconcile deposits: server down',
      { variant: 'error' },
    );
  });
});
