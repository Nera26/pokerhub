import { sendAction, disconnectGameSocket } from '@/lib/socket';

const handlers: Record<string, ((payload?: any) => void)[]> = {};

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

jest.mock('@/app/utils/socket', () => ({
  getSocket: jest.fn(() => mockSocket),
  disconnectSocket: jest.fn(),
}));

describe('emitWithAck', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSocket.emit.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    Object.keys(handlers).forEach((k) => delete handlers[k]);
  });

  afterEach(() => {
    jest.useRealTimers();
    disconnectGameSocket();
    jest.clearAllMocks();
  });

  it('retries once before resolving on ack', async () => {
    const promise = sendAction({
      type: 'bet',
      tableId: 't',
      playerId: 'p',
      amount: 1,
    });

    expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(2000);
    expect(mockSocket.emit).toHaveBeenCalledTimes(2);

    const actionId = mockSocket.emit.mock.calls[0][1].actionId;
    handlers['action:ack'][0]({ actionId });

    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects after retries and clears pending', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    const promise = sendAction({
      type: 'bet',
      tableId: 't',
      playerId: 'p',
      amount: 1,
    });

    jest.advanceTimersByTime(4000);

    await expect(promise).rejects.toThrow('No ACK received');
    expect(alertSpy).toHaveBeenCalled();

    const before = mockSocket.emit.mock.calls.length;
    handlers['connect'][0]();
    expect(mockSocket.emit).toHaveBeenCalledTimes(before + 1);
    expect(mockSocket.emit.mock.calls[before][0]).toBe('resume');

    alertSpy.mockRestore();
  });
});

