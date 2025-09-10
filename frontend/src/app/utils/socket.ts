'use client';

import type { Socket } from 'socket.io-client';
import { env } from '@/lib/env';
import {
  getSocket as coreGetSocket,
  disconnectSocket as coreDisconnectSocket,
  type SocketOptions,
} from '@/lib/socket-core';

export function getSocket(options: SocketOptions = {}): Socket {
  if (env.IS_E2E) {
    return {
      on: () => void 0,
      off: () => void 0,
      once: () => void 0,
      emit: () => void 0,
      disconnect: () => void 0,
      io: { on: () => void 0, off: () => void 0 },
    } as unknown as Socket;
  }
  return coreGetSocket(options) as Socket;
}

export function disconnectSocket(namespace?: string): void {
  if (env.IS_E2E) return;
  coreDisconnectSocket(namespace);
}
