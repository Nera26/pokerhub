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

describe('Messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders messages and allows replying', async () => {
    (fetchMessages as jest.Mock).mockResolvedValue({
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
    });
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
});
