'use client';

import { io, type Socket, type Manager } from 'socket.io-client';
import type { Packet } from 'socket.io-parser';
import { dispatchGlobalError } from '@/hooks/useApiError';
import { env } from '@/lib/env';
import { getBaseUrl } from '@/lib/base-url';

const SOCKET_URL =
  env.NEXT_PUBLIC_SOCKET_URL ?? getBaseUrl().replace(/^http/, 'ws');

interface FrameAckPayload {
  frameId: string;
}

type ServerEventName = 'connect' | 'disconnect' | 'error' | 'connect_error';

interface ServerEvents {
  connect: () => void;
  disconnect: () => void;
  error: (err: Error) => void;
  connect_error: (err: Error) => void;
  [event: string]: (...args: any[]) => void;
}

interface ClientEvents {
  'frame:ack': (payload: FrameAckPayload) => void;
  [event: string]: (...args: any[]) => void;
}

interface Listener<E extends ServerEventName> {
  event: E;
  handler: ServerEvents[E];
}

type BrowserSocket = Socket<ServerEvents, ClientEvents>;

interface SocketEntry {
  socket: BrowserSocket;
  listeners: Listener<ServerEventName>[];
}

const sockets: Record<string, SocketEntry> = {};
const FRAME_ACK = Symbol('frameAck');

export interface SocketOptions {
  namespace?: string;
  onConnect?: ServerEvents['connect'];
  onDisconnect?: ServerEvents['disconnect'];
  onError?: ServerEvents['error'];
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export interface EmitHooks {
  onSend?: (payload: Record<string, unknown>, actionId: string) => void;
  onCleanup?: (actionId: string) => void;
}

export function getSocket(options: SocketOptions = {}): BrowserSocket {
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

  const addListener = <E extends ServerEventName>(
    event: E,
    handler: ServerEvents[E],
  ): void => {
    const existingIndex = listeners.findIndex((l) => l.event === event);

    if (existingIndex !== -1) {
      const existing = listeners[existingIndex] as Listener<E>;

      if (existing.handler === handler) {
        return;
      }

      socket.off(event, existing.handler as any);
      socket.on(event, handler as any);
      listeners[existingIndex] = { event, handler };
      return;
    }

    socket.on(event, handler as any);
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
      entry.socket.off(event, handler as any);
    });
    entry.listeners.length = 0;
    entry.socket.disconnect();
    delete sockets[ns];
  }
}

export function emitWithAck(
  namespace: string | undefined,
  event: string,
  payload: Record<string, unknown>,
  ackEvent: string,
  retries = 1,
  hooks: EmitHooks = {},
): Promise<void> {
  const s = getSocket({ namespace });
  const actionId =
    (payload.actionId as string | undefined) ??
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Date.now().toString());
  const fullPayload = { ...payload, actionId };
  hooks.onSend?.(fullPayload, actionId);

  return new Promise<void>((resolve, reject) => {
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timer);
      s.off(ackEvent, handler as any);
      hooks.onCleanup?.(actionId);
    };

    const fail = () => {
      cleanup();
      dispatchGlobalError('Failed to send request. Please try again.');
      reject(new Error('No ACK received'));
    };

    const handler = (ack: { actionId: string }) => {
      if (ack?.actionId === actionId) {
        cleanup();
        resolve();
      }
    };

    const baseDelay = 2000;
    const maxDelay = 8000;

    const send = () => {
      s.emit(event as any, fullPayload);
      const delay = Math.min(baseDelay * 2 ** attempts, maxDelay);
      timer = setTimeout(() => {
        if (attempts < retries) {
          attempts++;
          send();
        } else {
          fail();
        }
      }, delay);
    };

    s.on(ackEvent, handler as any);
    send();
  });
}

export type { BrowserSocket };
