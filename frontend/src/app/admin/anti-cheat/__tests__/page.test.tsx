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
      {
        id: '1',
        users: ['PlayerOne'],
        history: [{ action: 'warn', timestamp: 1, reviewerId: 'admin' }],
        status: 'flagged',
      },
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
        { id: '1', users: ['PlayerOne'], history: [], status: 'flagged' },
      ])
      .mockResolvedValueOnce([
        {
          id: '1',
          users: ['PlayerOne'],
          history: [{ action: 'warn', timestamp: 2, reviewerId: 'admin' }],
          status: 'warn',
        },
      ]);
    (fetchNextAction as jest.Mock).mockResolvedValue('warn');
    (updateFlag as jest.Mock).mockResolvedValue({});

    renderPage();
    const btn = await screen.findByRole('button', { name: 'Warn' });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    await waitFor(() =>
      expect(fetchNextAction).toHaveBeenCalledWith('flagged'),
    );
    await waitFor(() => expect(updateFlag).toHaveBeenCalledWith('1', 'warn'));
    expect(
      await screen.findByRole('button', { name: 'Restrict' }),
    ).toBeInTheDocument();
  });
});
