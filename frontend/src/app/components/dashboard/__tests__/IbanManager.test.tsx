import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IbanManager from '../IbanManager';
import { useIban, useIbanHistory } from '@/hooks/wallet';
import { updateIban } from '@/lib/api/wallet';

jest.mock('@/hooks/wallet', () => ({
  ...jest.requireActual('@/hooks/wallet'),
  useIban: jest.fn(),
  useIbanHistory: jest.fn(),
}));

jest.mock('@/lib/api/wallet', () => ({
  updateIban: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement, client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('IbanManager', () => {
  beforeEach(() => {
    (useIban as jest.Mock).mockReturnValue({
      data: {
        iban: 'DE02123456789012345678',
        masked: 'DE02 **** **** **** 5678',
        holder: 'PokerPro Gaming Ltd.',
        instructions: 'Use ref 123',
        updatedBy: 'Alice',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
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
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('updates IBAN and invalidates queries', async () => {
    (updateIban as jest.Mock).mockResolvedValue({ message: 'ok' });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    renderWithClient(<IbanManager />, client);

    fireEvent.click(screen.getByRole('button', { name: /manage iban/i }));

    const ibanInput = await screen.findByPlaceholderText(
      /DE02 5001 0517 5407 4100 72/i,
    );
    fireEvent.change(ibanInput, {
      target: { value: 'DE44500105175407324931' },
    });

    const holderInput = screen.getByPlaceholderText(/PokerPro Gaming Ltd./i);
    fireEvent.change(holderInput, { target: { value: 'New Holder' } });

    fireEvent.click(screen.getByRole('button', { name: /update iban/i }));

    await waitFor(() =>
      expect(updateIban).toHaveBeenCalledWith({
        iban: 'DE44500105175407324931',
        holder: 'New Holder',
        notes: '',
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['iban'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['iban-history'] });
  });

  it('renders history entries', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    renderWithClient(<IbanManager />, client);

    fireEvent.click(screen.getByRole('button', { name: /manage iban/i }));

    await screen.findByText('DE03111111111111111111');
  });
});
