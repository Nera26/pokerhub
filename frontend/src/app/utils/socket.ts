'use client';

// utils/socket.ts
// Utility for managing socket.io connections in the browser only
import { io, type Socket, type Manager } from 'socket.io-client';
import type { Packet } from 'socket.io-parser';
import { env } from '@/lib/env';
import { getBaseUrl } from '@/lib/base-url';

const SOCKET_URL =
  env.NEXT_PUBLIC_SOCKET_URL ?? getBaseUrl().replace(/^http/, 'ws');

interface FrameAckPayload {
  frameId: string;
}

interface ServerEvents {
  connect: () => void;
  disconnect: () => void;
  error: (err: Error) => void;
  connect_error: (err: Error) => void;
}

interface ClientEvents {
  'frame:ack': (payload: FrameAckPayload) => void;
}

interface Listener<E extends keyof ServerEvents> {
  event: E;
  handler: ServerEvents[E];
}

type BrowserSocket = Socket<ServerEvents, ClientEvents>;

interface SocketEntry {
  socket: BrowserSocket;
  listeners: Listener<keyof ServerEvents>[];
}

const sockets: Record<string, SocketEntry> = {};
const FRAME_ACK = Symbol('frameAck');

interface SocketOptions {
  namespace?: string;
  onConnect?: ServerEvents['connect'];
  onDisconnect?: ServerEvents['disconnect'];
  onError?: ServerEvents['error'];
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export function getSocket(options: SocketOptions = {}): BrowserSocket {
  if (env.IS_E2E) {
    return {
      on: () => void 0,
      off: () => void 0,
      once: () => void 0,
      emit: () => void 0,
      disconnect: () => void 0,
      io: { on: () => void 0, off: () => void 0 },
    } as unknown as BrowserSocket;
  }

  const ns = options.namespace ?? '';
  if (!sockets[ns]) {
    const url = ns ? `${SOCKET_URL}/${ns}` : SOCKET_URL;
    sockets[ns] = {
      socket: io(url, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: options.reconnectionAttempts,
        reconnectionDelay: options.reconnectionDelay,
      }) as BrowserSocket,
      listeners: [],
    };

    type AckManager = Manager<ServerEvents, ClientEvents> & {
      [FRAME_ACK]?: (packet: Packet) => void;
    };
    const manager: AckManager = sockets[ns].socket.io as AckManager;
    if (!manager[FRAME_ACK]) {
      const handler = (packet: Packet) => {
        const frameId = (
          packet.data as { [index: number]: { frameId?: string } } | undefined
        )?.[1]?.frameId;
        if (!frameId) return;
        const nsp = packet.nsp && packet.nsp !== '/' ? packet.nsp.slice(1) : '';
        sockets[nsp]?.socket.emit('frame:ack', { frameId });
      };
      manager.on('packet', handler);
      manager[FRAME_ACK] = handler;
    }
  }

  const entry = sockets[ns];
  const { socket, listeners } = entry;

  const addListener = <E extends keyof ServerEvents>(
    event: E,
    handler: ServerEvents[E],
  ): void => {
    const existingIndex = listeners.findIndex((l) => l.event === event);

    if (existingIndex !== -1) {
      const existing = listeners[existingIndex] as Listener<E>;

      if (existing.handler === handler) {
        return;
      }

      socket.off(event, existing.handler);
      socket.on(event, handler);
      listeners[existingIndex] = { event, handler };
      return;
    }

    socket.on(event, handler);
    listeners.push({ event, handler });
  };

  if (options.onConnect) {
    addListener('connect', options.onConnect);
  }

  if (options.onDisconnect) {
    addListener('disconnect', options.onDisconnect);
  }

  if (options.onError) {
    addListener('error', options.onError);
    addListener('connect_error', options.onError);
  }

  return socket;
}

export function disconnectSocket(namespace?: string): void {
  const ns = namespace ?? '';
  const entry = sockets[ns];
  if (entry) {
    entry.listeners.forEach(({ event, handler }) => {
      entry.socket.off(event, handler);
    });
    entry.listeners.length = 0;
    entry.socket.disconnect();
    delete sockets[ns];
  }
}
