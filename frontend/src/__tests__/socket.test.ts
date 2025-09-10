const handlers: Record<string, ((payload?: any) => void)[]> = {};

jest.mock('@/hooks/useApiError', () => ({
  dispatchGlobalError: jest.fn(),
}));

import { dispatchGlobalError } from '@/hooks/useApiError';
import { createNamespaceSocket } from '@/lib/socket-namespace';

const mockSocket = {
  on: jest.fn((event: string, handler: (payload?: any) => void) => {
    handlers[event] = handlers[event] || [];
    handlers[event].push(handler);
  }),
  off: jest.fn((event: string, handler?: (payload?: any) => void) => {
    if (!handlers[event]) return;
    if (handler) {
      handlers[event] = handlers[event].filter((h) => h !== handler);
    } else {
      delete handlers[event];
    }
  }),
  emit: jest.fn(),
};

jest.mock('@/lib/socket-core', () => {
  const actual = jest.requireActual('@/lib/socket-core');
  return {
    ...actual,
    getSocket: jest.fn(() => mockSocket),
    disconnectSocket: jest.fn(),
  };
});

const { emitWithAck, disconnect } = createNamespaceSocket('game');

describe('emitWithAck', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSocket.emit.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    (dispatchGlobalError as jest.Mock).mockClear();
    Object.keys(handlers).forEach((k) => delete handlers[k]);
  });

  afterEach(() => {
    jest.useRealTimers();
    disconnect();
    jest.clearAllMocks();
  });

  it('retries with exponential backoff before resolving on ack', async () => {
    const promise = emitWithAck('action', {}, 'action:ack', 2);

    expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(2000);
    expect(mockSocket.emit).toHaveBeenCalledTimes(2);

    // second retry should wait longer than the first
    jest.advanceTimersByTime(3999);
    expect(mockSocket.emit).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(1);
    expect(mockSocket.emit).toHaveBeenCalledTimes(3);

    const actionId = mockSocket.emit.mock.calls[0][1].actionId;
    handlers['action:ack'][0]({ actionId });

    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects after retries and reports error', async () => {
    const promise = emitWithAck('action', {}, 'action:ack', 1);

    jest.advanceTimersByTime(6000);

    await expect(promise).rejects.toThrow('No ACK received');
    expect(dispatchGlobalError).toHaveBeenCalledWith(
      'Failed to send request. Please try again.',
    );
  });

  it('calls hooks on send and cleanup', async () => {
    const onSend = jest.fn();
    const onCleanup = jest.fn();
    const promise = emitWithAck('action', {}, 'action:ack', 1, {
      onSend,
      onCleanup,
    });
    const actionId = mockSocket.emit.mock.calls[0][1].actionId;
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ actionId }),
      actionId,
    );
    handlers['action:ack'][0]({ actionId });
    await promise;
    expect(onCleanup).toHaveBeenCalledWith(actionId);
  });
});
