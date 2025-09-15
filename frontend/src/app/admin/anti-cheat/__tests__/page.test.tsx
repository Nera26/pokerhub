import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AntiCheatPage from '../page';
import { fetchFlags, updateFlag, fetchNextAction } from '@/lib/api/antiCheat';

jest.mock('@/lib/api/antiCheat', () => ({
  fetchFlags: jest.fn(),
  updateFlag: jest.fn(),
  fetchNextAction: jest.fn(),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <AntiCheatPage />
    </QueryClientProvider>,
  );
}

describe('AntiCheatPage', () => {
  it('renders flags on success', async () => {
    (fetchFlags as jest.Mock).mockResolvedValue([
      { id: '1', player: 'PlayerOne', history: ['h1'], action: 'warn' },
    ]);
    renderPage();
    expect(await screen.findByText('PlayerOne')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    (fetchFlags as jest.Mock).mockRejectedValue(new Error('fail'));
    renderPage();
    expect(await screen.findByText('Error loading flags')).toBeInTheDocument();
  });

  it('escalates flag using next action from API', async () => {
    (fetchFlags as jest.Mock)
      .mockResolvedValueOnce([
        { id: '1', player: 'PlayerOne', history: [], action: 'warn' },
      ])
      .mockResolvedValueOnce([
        { id: '1', player: 'PlayerOne', history: [], action: 'ban' },
      ]);
    (fetchNextAction as jest.Mock).mockResolvedValue('ban');
    (updateFlag as jest.Mock).mockResolvedValue({});

    renderPage();
    const btn = await screen.findByRole('button', { name: 'Warn' });
    fireEvent.click(btn);
    await waitFor(() => expect(fetchNextAction).toHaveBeenCalledWith('warn'));
    await waitFor(() => expect(updateFlag).toHaveBeenCalledWith('1', 'ban'));
    expect(btn).toBeDisabled();
    expect(
      await screen.findByRole('button', { name: 'Ban' }),
    ).toBeInTheDocument();
  });
});
