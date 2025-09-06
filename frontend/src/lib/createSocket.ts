import type { Socket } from 'socket.io-client';
import { getSocket as baseGetSocket, disconnectSocket } from '@/app/utils/socket';

export function createNamespaceSocket(ns: string) {
  let socket: Socket | null = null;

  const getSocket = (
    options: Parameters<typeof baseGetSocket>[0] = {},
  ): Socket => {
    socket = baseGetSocket({ namespace: ns, ...options }) as Socket;
    return socket;
  };

  const disconnect = (): void => {
    if (socket) {
      disconnectSocket(ns);
      socket = null;
    }
  };

  return { getSocket, disconnect };
}

