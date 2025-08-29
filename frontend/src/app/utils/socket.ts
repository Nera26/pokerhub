'use client';

// utils/socket.ts
// Utility for managing socket.io connections in the browser only
import { io, Socket } from 'socket.io-client';
import { env, IS_E2E } from '@/lib/env';

const SOCKET_URL = env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

interface EventMap {
  connect: () => void;
  disconnect: () => void;
  error: (err: Error) => void;
  connect_error: (err: Error) => void;
}

interface Listener<E extends keyof EventMap> {
  event: E;
  handler: EventMap[E];
}

interface SocketEntry {
  socket: Socket<EventMap>;
  listeners: Listener<keyof EventMap>[];
}

const sockets: Record<string, SocketEntry> = {};
const FRAME_ACK = Symbol('frameAck');

interface SocketOptions {
  namespace?: string;
  onConnect?: EventMap['connect'];
  onDisconnect?: EventMap['disconnect'];
  onError?: EventMap['error'];
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export function getSocket(options: SocketOptions = {}): Socket<EventMap> {
  if (IS_E2E) {
    return {
      on: () => void 0,
      off: () => void 0,
      once: () => void 0,
      emit: () => void 0,
      disconnect: () => void 0,
      io: { on: () => void 0, off: () => void 0 },
    } as unknown as Socket<EventMap>;
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
      }),
      listeners: [],
    };

    const manager = (sockets[ns].socket.io as any);
    if (!manager[FRAME_ACK]) {
      const handler = (packet: any) => {
        const frameId = packet?.data?.[1]?.frameId;
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

  const addListener = <E extends keyof EventMap>(
    event: E,
    handler: EventMap[E],
  ): void => {
    const existingIndex = listeners.findIndex((l) => l.event === event);

    if (existingIndex !== -1) {
      const existing = listeners[existingIndex] as Listener<E>;

      if (existing.handler === handler) {
        return;
      }

      socket.off(event as any, existing.handler as any);
      socket.on(event as any, handler as any);
      listeners[existingIndex] = { event, handler };
      return;
    }

    socket.on(event as any, handler as any);
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
