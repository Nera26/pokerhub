import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import BroadcastPanel from '../BroadcastPanel';
import { fetchMessages } from '@/lib/api/messages';
import { sendBroadcast } from '@/lib/api/broadcasts';
import useBroadcastTypes from '@/hooks/useBroadcastTypes';

jest.mock('@/hooks/useApiError', () => ({ useApiError: () => {} }));
jest.mock('@/lib/api/messages', () => ({
  fetchMessages: jest.fn(),
}));
jest.mock('@/lib/api/broadcasts', () => ({
  sendBroadcast: jest.fn(),
}));
jest.mock('@/hooks/useBroadcastTypes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseBroadcastTypes = useBroadcastTypes as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseBroadcastTypes.mockReturnValue({
    data: {
      types: {
        announcement: { icon: '', color: '' },
        alert: { icon: '', color: '' },
      },
    },
    isLoading: false,
    error: null,
  });
});

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
      await screen.findByText(/failed to fetch admin messages/i),
    ).toBeInTheDocument();
  });

  it('sends broadcast and clears input', async () => {
    (fetchMessages as jest.Mock).mockResolvedValue({ messages: [] });
    (sendBroadcast as jest.Mock).mockResolvedValue({ status: 'ok' });
    renderWithClient(<BroadcastPanel />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Broadcast message...');
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: /send broadcast/i }));
    await waitFor(() =>
      expect(sendBroadcast).toHaveBeenCalledWith({
        text: 'hello',
        type: 'announcement',
      }),
    );
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
