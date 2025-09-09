import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BroadcastPanel from '../BroadcastPanel';
import { fetchMessages, sendBroadcast } from '@/lib/api/messages';

jest.mock('@/hooks/useApiError', () => ({ useApiError: () => {} }));
jest.mock('@/lib/api/messages', () => ({
  fetchMessages: jest.fn(),
  sendBroadcast: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('BroadcastPanel', () => {
  it('renders messages from server', async () => {
    (fetchMessages as jest.Mock).mockResolvedValue({
      messages: [
        {
          id: 1,
          sender: 'Alice',
          preview: 'Hi',
          userId: '1',
          avatar: '',
          subject: '',
          content: '',
          time: '',
          read: false,
        },
      ],
    });
    renderWithClient(<BroadcastPanel />);
    expect(await screen.findByText('Alice')).toBeInTheDocument();
  });

  it('shows error on failure', async () => {
    (fetchMessages as jest.Mock).mockRejectedValue(new Error('oops'));
    renderWithClient(<BroadcastPanel />);
    expect(
      await screen.findByText(/failed to load messages/i),
    ).toBeInTheDocument();
  });

  it('sends broadcast and clears input', async () => {
    (fetchMessages as jest.Mock).mockResolvedValue({ messages: [] });
    (sendBroadcast as jest.Mock).mockResolvedValue({ status: 'ok' });
    renderWithClient(<BroadcastPanel />);
    const input = screen.getByPlaceholderText('Broadcast message...');
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: /send broadcast/i }));
    await waitFor(() => expect(sendBroadcast).toHaveBeenCalledWith('hello'));
    expect(input).toHaveValue('');
  });

  it('shows error when broadcast fails', async () => {
    (fetchMessages as jest.Mock).mockResolvedValue({ messages: [] });
    (sendBroadcast as jest.Mock).mockRejectedValue(new Error('fail'));
    renderWithClient(<BroadcastPanel />);
    const input = screen.getByPlaceholderText('Broadcast message...');
    fireEvent.change(input, { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: /send broadcast/i }));
    expect(
      await screen.findByText(/failed to send broadcast/i),
    ).toBeInTheDocument();
  });
});
