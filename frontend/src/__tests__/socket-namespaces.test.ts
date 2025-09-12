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
  spectate: createMockSocket(),
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
import {
  subscribeToTable,
  disconnectSpectatorSocket,
} from '@/lib/spectator-socket';

describe.skip('namespace sockets', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('spectator socket wires handlers and cleans up', () => {
    const socket = mockSockets.spectate;
    const handler = jest.fn();
    const unsubscribe = subscribeToTable('table1', handler);
    expect(socket.on).toHaveBeenCalled();

    unsubscribe();
    expect(socket.emit).toHaveBeenCalledWith('leave', { tableId: 'table1' });
  });

  test('disconnect helpers tear down sockets', () => {
    disconnectSpectatorSocket();
  });
});
