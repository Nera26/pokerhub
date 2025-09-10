import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act, type MutableRefObject } from 'react';
import ChatWidget from '@/app/components/common/chat/ChatWidget';
import ChatHeader from '@/app/components/common/chat/ChatHeader';
import ChatLog from '@/app/components/common/chat/ChatLog';
import ChatInput from '@/app/components/common/chat/ChatInput';
import type { Message } from '@/app/components/common/chat/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock socket utilities to control connection and emissions
const handlers: Record<string, (...args: unknown[]) => void> = {};
const emit = jest.fn();
const on = jest.fn((event: string, handler: (...args: unknown[]) => void) => {
  handlers[event] = handler;
});
const once = jest.fn((event: string, handler: (...args: unknown[]) => void) => {
  handlers[event] = handler;
});
const off = jest.fn((event: string) => {
  delete handlers[event];
});
const socketMock = {
  on,
  once,
  off,
  emit,
  disconnect: jest.fn(),
  io: { on, off },
};

interface SocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (err: unknown) => void;
}

jest.mock('@/lib/socket-core', () => ({
  getSocket: jest.fn((options?: SocketOptions) => {
    if (options?.onConnect) handlers['connect'] = options.onConnect;
    if (options?.onDisconnect) handlers['disconnect'] = options.onDisconnect;
    if (options?.onError) {
      handlers['error'] = options.onError;
      handlers['connect_error'] = options.onError;
    }
    return socketMock;
  }),
  disconnectSocket: jest.fn(),
}));

describe('ChatWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key in handlers) delete handlers[key];
  });

  function renderWithClient(ui: React.ReactElement) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  }

  function setupChatWidget() {
    renderWithClient(<ChatWidget />);
    act(() => handlers['connect'] && handlers['connect']());
    const user = userEvent.setup();
    return { user, handlers };
  }

  it.each(['click', 'enter'] as const)(
    'sends message with %s',
    async (method) => {
      const { user } = setupChatWidget();
      await act(async () => {
        await user.click(screen.getByRole('button'));
      });
      const input = screen.getByPlaceholderText('Type your message...');
      await act(async () => {
        await user.type(input, 'hello');
      });
      if (method === 'click') {
        const sendButton = screen.getAllByRole('button')[2];
        await act(async () => {
          await user.click(sendButton);
        });
      } else {
        await act(async () => {
          await user.keyboard('{Enter}');
        });
      }
      expect(await screen.findByText('hello')).toBeInTheDocument();
      expect(emit).toHaveBeenCalledWith(
        'message',
        expect.objectContaining({ text: 'hello' }),
      );
    },
  );

  it('toggles open and closed', async () => {
    renderWithClient(<ChatWidget />);
    act(() => handlers['connect'] && handlers['connect']());

    const user = userEvent.setup();
    const toggle = screen.getByRole('button');
    await act(async () => {
      await user.click(toggle);
    });
    expect(
      screen.getByPlaceholderText('Type your message...'),
    ).toBeInTheDocument();

    const close = screen.getAllByRole('button')[1];
    await act(async () => {
      await user.click(close);
    });
    expect(
      screen.queryByPlaceholderText('Type your message...'),
    ).not.toBeInTheDocument();
  });

  it('shows connection error banner', async () => {
    renderWithClient(<ChatWidget />);
    act(() => handlers['connect_error'] && handlers['connect_error']());

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    const banner = await screen.findByRole('status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(banner).toHaveTextContent(/connection lost/i);
    const input = screen.getByPlaceholderText('Connecting...');
    expect(input).toBeDisabled();
  });

  it('announces connection status when connecting', async () => {
    renderWithClient(<ChatWidget />);
    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });
    const banner = screen.getByRole('status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(banner).toHaveTextContent(/connecting/i);
    act(() => handlers['connect_error'] && handlers['connect_error']());
    expect(await screen.findByText(/connection lost/i)).toBeInTheDocument();
  });

  it('appends incoming messages inside the live region', async () => {
    renderWithClient(<ChatWidget />);
    act(() => handlers['connect'] && handlers['connect']());

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole('button'));
    });

    await act(async () => {
      handlers['message']?.({
        id: 1,
        sender: 'admin',
        text: 'welcome',
        time: '10:00',
      });
    });

    const msg = await screen.findByText('welcome');
    const log = screen.getByRole('log');
    expect(log).toContainElement(msg);
    expect(log).toHaveAttribute('aria-live', 'polite');
  });
});

describe('ChatHeader', () => {
  it('calls onClose when close button clicked', async () => {
    const onClose = jest.fn();
    render(<ChatHeader onClose={onClose} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ChatLog', () => {
  it('renders messages', () => {
    const messages: Message[] = [
      { id: 1, sender: 'player', text: 'hi', time: '10:00' },
      { id: 2, sender: 'admin', text: 'hello', time: '10:01' },
    ];
    const ref = {
      current: null,
    } as unknown as MutableRefObject<HTMLDivElement | null>;
    render(
      <ChatLog messages={messages} chatRef={ref} retryMessage={() => {}} />,
    );
    expect(screen.getByText('hi')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});

describe('ChatInput', () => {
  it('triggers sendMessage and setInput', async () => {
    const send = jest.fn();
    const set = jest.fn();
    render(
      <ChatInput
        input="hi"
        setInput={set}
        handleKeyDown={() => {}}
        sendMessage={send}
        disabled={false}
      />,
    );
    const user = userEvent.setup();
    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'a');
    expect(set).toHaveBeenCalled();
    await user.click(screen.getByRole('button'));
    expect(send).toHaveBeenCalled();
  });
});

afterAll(() => {
  jest.resetModules();
});
