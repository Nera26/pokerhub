import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import Messages from '../Messages';
import {
  fetchMessages,
  replyMessage,
  markMessageRead,
} from '@/lib/api/messages';

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: any) => <img {...props} />,
}));

jest.mock('@/lib/api/messages', () => ({
  fetchMessages: jest.fn(),
  replyMessage: jest.fn(),
  markMessageRead: jest.fn(),
}));

function buildMessages() {
  return {
    messages: [
      {
        id: 1,
        sender: 'Bob',
        preview: 'Hello',
        subject: 'Hi',
        content: 'Hello there',
        userId: '2',
        avatar: '',
        time: '',
        read: false,
      },
    ],
  };
}

describe('Messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders messages and allows replying', async () => {
    (fetchMessages as jest.Mock).mockResolvedValue(buildMessages());
    (replyMessage as jest.Mock).mockResolvedValue({});
    renderWithClient(<Messages />);

    const replyBtn = await screen.findByRole('button', { name: /reply/i });
    fireEvent.click(replyBtn);

    const textarea =
      await screen.findByPlaceholderText(/type your reply here/i);
    fireEvent.change(textarea, { target: { value: 'Thanks' } });

    fireEvent.click(screen.getByRole('button', { name: /send reply/i }));

    await waitFor(() =>
      expect(replyMessage).toHaveBeenCalledWith(1, { reply: 'Thanks' }),
    );
  });

  it('marks messages as read when viewing', async () => {
    (fetchMessages as jest.Mock).mockResolvedValue(buildMessages());
    (markMessageRead as jest.Mock).mockResolvedValue({});
    renderWithClient(<Messages />);

    const viewBtn = await screen.findByRole('button', { name: /view/i });
    fireEvent.click(viewBtn);

    await waitFor(() => expect(markMessageRead).toHaveBeenCalledWith(1));
  });

  it('reconciles optimistic update with server payload', async () => {
    (fetchMessages as jest.Mock)
      .mockResolvedValueOnce(buildMessages())
      .mockResolvedValue({
        messages: [
          {
            id: 1,
            sender: 'Bob',
            preview: 'Updated preview',
            subject: 'Hi',
            content: 'Hello there',
            userId: '2',
            avatar: '',
            time: '',
            read: true,
          },
        ],
      });
    (markMessageRead as jest.Mock).mockResolvedValue({
      id: 1,
      sender: 'Bob',
      preview: 'Updated preview',
      subject: 'Hi',
      content: 'Hello there',
      userId: '2',
      avatar: '',
      time: '',
      read: true,
    });

    renderWithClient(<Messages />);

    await screen.findByText('Hello');
    const viewBtn = await screen.findByRole('button', { name: /view/i });
    fireEvent.click(viewBtn);

    await waitFor(() => expect(markMessageRead).toHaveBeenCalledWith(1));
    await screen.findByText('0 Unread');
    await waitFor(() => expect(fetchMessages).toHaveBeenCalledTimes(2));
    await screen.findByText('Updated preview');
  });
});
