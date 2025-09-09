import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IbanManager from '../IbanManager';
import { useIban, useIbanHistory } from '@/hooks/wallet';
import { updateIban } from '@/lib/api/wallet';

jest.mock('@/hooks/wallet');
jest.mock('@/lib/api/wallet', () => ({
  updateIban: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('IbanManager', () => {
  let ibanRefetch: jest.Mock;
  let historyRefetch: jest.Mock;

  beforeEach(() => {
    ibanRefetch = jest.fn();
    historyRefetch = jest.fn();

    (useIban as jest.Mock).mockReturnValue({
      data: {
        iban: 'DE02123456789012345678',
        masked: 'DE02 **** **** **** 5678',
        holder: 'PokerPro Gaming Ltd.',
        instructions: 'Use ref 123',
        updatedBy: 'Alice',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      refetch: ibanRefetch,
    });

    (useIbanHistory as jest.Mock).mockReturnValue({
      data: {
        history: [
          {
            date: '2024-01-01',
            oldIban: 'DE02111111111111111111',
            newIban: 'DE03111111111111111111',
            by: 'Bob',
            notes: 'changed',
          },
        ],
      },
      refetch: historyRefetch,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('updates IBAN and refreshes query', async () => {
    (updateIban as jest.Mock).mockResolvedValue({ message: 'ok' });

    renderWithClient(<IbanManager />);

    fireEvent.click(screen.getByRole('button', { name: /manage iban/i }));

    const ibanInput = await screen.findByPlaceholderText(
      /DE02 5001 0517 5407 4100 72/i,
    );
    fireEvent.change(ibanInput, {
      target: { value: 'DE44500105175407324931' },
    });

    const holderInput = screen.getByPlaceholderText(/PokerPro Gaming Ltd./i);
    fireEvent.change(holderInput, { target: { value: 'New Holder' } });

    fireEvent.click(
      screen.getByRole('button', { name: /update iban/i }),
    );

    await waitFor(() =>
      expect(updateIban).toHaveBeenCalledWith(
        'DE44500105175407324931',
        'New Holder',
        '',
      ),
    );
    expect(ibanRefetch).toHaveBeenCalled();
    expect(historyRefetch).toHaveBeenCalled();
  });

  it('renders history entries', async () => {
    renderWithClient(<IbanManager />);

    fireEvent.click(screen.getByRole('button', { name: /manage iban/i }));

    await screen.findByText('DE03111111111111111111');
  });
});

