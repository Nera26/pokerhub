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

let socket: Socket<EventMap> | null = null;

interface Listener<E extends keyof EventMap> {
  event: E;
  handler: EventMap[E];
}

const listeners: Listener<keyof EventMap>[] = [];

interface SocketOptions {
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

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: options.reconnectionAttempts,
      reconnectionDelay: options.reconnectionDelay,
    });
  }

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

      socket!.off(event as any, existing.handler as any);
      socket!.on(event as any, handler as any);
      listeners[existingIndex] = { event, handler };
      return;
    }

    socket!.on(event as any, handler as any);
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

export function disconnectSocket(): void {
  if (socket) {
    listeners.forEach(({ event, handler }) => {
      socket!.off(event, handler);
    });
    listeners.length = 0;
    socket.disconnect();
    socket = null;
  }
}
