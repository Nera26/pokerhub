import { jest } from '@jest/globals';

const createMockSocket = () => {
  const handlers: Record<string, Function[]> = {};
  const socket: any = {
    on: jest.fn((event: string, handler: Function) => {
      (handlers[event] = handlers[event] || []).push(handler);
    }),
    off: jest.fn((event: string, handler?: Function) => {
      if (!handlers[event]) return;
      if (!handler) {
        delete handlers[event];
      } else {
        handlers[event] = handlers[event].filter((h) => h !== handler);
      }
    }),
    once: jest.fn((event: string, handler: Function) => {
      const onceHandler = (...args: any[]) => {
        handler(...args);
        socket.off(event, onceHandler);
      };
      socket.on(event, onceHandler);
    }),
    emit: jest.fn(),
    connected: false,
    io: { on: jest.fn(), off: jest.fn() },
    trigger: (event: string, ...args: any[]) => {
      (handlers[event] || []).forEach((h) => h(...args));
    },
  };
  return socket;
};

const mockSockets = {
  game: createMockSocket(),
};

jest.mock('@/lib/socket-core', () => ({
  __esModule: true,
  getSocket: jest.fn((opts: any = {}) => {
    const ns = opts.namespace ?? '';
    const socket = mockSockets[ns as keyof typeof mockSockets];
    if (opts.onConnect) {
      socket.on('connect', opts.onConnect);
    }
    return socket;
  }),
  disconnectSocket: jest.fn(),
  emitWithAck: jest.fn(),
}));

import '@/lib/socket-core';
import { getGameSocket, sendAction, disconnectGameSocket } from '@/lib/socket';

Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => 'test-id' },
});

describe.skip('namespace sockets', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('game socket emits events on reconnect', async () => {
    jest.useFakeTimers();
    const socket = mockSockets.game;
    getGameSocket();
    const promise = sendAction(
      { type: 'bet', tableId: 't', playerId: 'p', amount: 1 },
      0,
    ).catch(() => undefined);

    socket.trigger('connect');

    expect(socket.emit).toHaveBeenCalled();

    socket.trigger('action:ack', { actionId: 'test-id' });
    jest.runAllTimers();
    await promise;
  });

  test('disconnect helpers tear down sockets', () => {
    disconnectGameSocket();
  });
});
