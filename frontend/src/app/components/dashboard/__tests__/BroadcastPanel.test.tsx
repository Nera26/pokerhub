import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import BroadcastPanel from '../BroadcastPanel';
import { fetchMessages } from '@/lib/api/messages';
import {
  fetchBroadcasts,
  fetchBroadcastTemplates,
  sendBroadcast,
} from '@/lib/api/broadcasts';
import { useBroadcastTypes } from '@/hooks/lookups';

jest.mock('@/hooks/useApiError', () => ({ useApiError: () => {} }));
jest.mock('@/lib/api/messages', () => ({
  fetchMessages: jest.fn(),
}));
jest.mock('@/lib/api/broadcasts', () => ({
  fetchBroadcasts: jest.fn(),
  fetchBroadcastTemplates: jest.fn(),
  sendBroadcast: jest.fn(),
}));
jest.mock('@/hooks/lookups', () => ({
  __esModule: true,
  useBroadcastTypes: jest.fn(),
}));

const mockUseBroadcastTypes = useBroadcastTypes as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (fetchBroadcasts as jest.Mock).mockResolvedValue({ broadcasts: [] });
  (fetchBroadcastTemplates as jest.Mock).mockResolvedValue({
    templates: {
      maintenance: 'Scheduled maintenance tonight at 10 PM UTC.',
      tournament: 'New tournament starts this weekend! Join now.',
    },
  });
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
  it('renders messages and broadcast history from server', async () => {
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
    (fetchBroadcasts as jest.Mock).mockResolvedValue({
      broadcasts: [
        {
          id: '1',
          type: 'announcement',
          text: 'Scheduled maintenance tonight at 10 PM UTC.',
          timestamp: '2024-03-02T12:00:00.000Z',
          urgent: true,
        },
      ],
    });
    renderWithClient(<BroadcastPanel />);
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(
      await screen.findByText('Scheduled maintenance tonight at 10 PM UTC.'),
    ).toBeInTheDocument();
    expect(await screen.findByText(/urgent/i)).toBeInTheDocument();
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
    const select = await screen.findByRole('combobox', {
      name: /broadcast type/i,
    });
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

  it('populates compose input when selecting a template', async () => {
    (fetchMessages as jest.Mock).mockResolvedValue({ messages: [] });
    renderWithClient(<BroadcastPanel />);
    const templateSelect = await screen.findByRole('combobox', {
      name: /broadcast template/i,
    });
    fireEvent.change(templateSelect, { target: { value: 'tournament' } });
    expect(screen.getByPlaceholderText('Broadcast message...')).toHaveValue(
      'New tournament starts this weekend! Join now.',
    );
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
