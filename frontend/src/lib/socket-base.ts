import type { Socket } from 'socket.io-client';
import {
  getSocket as coreGetSocket,
  disconnectSocket as coreDisconnectSocket,
  emitWithAck as coreEmitWithAck,
  type SocketOptions,
  type EmitHooks,
} from './socket-core';

type GetSocketOptions = SocketOptions;

export function initNamespaceSocket(namespace: string) {
  let socket: Socket | null = null;

  const getSocket = (options: GetSocketOptions = {}): Socket => {
    socket = coreGetSocket({ namespace, ...options }) as Socket;
    return socket;
  };

  const disconnect = (): void => {
    if (socket) {
      coreDisconnectSocket(namespace);
      socket = null;
    }
  };

  const emitWithAck = (
    event: string,
    payload: Record<string, unknown>,
    ackEvent: string,
    retries = 1,
    hooks: EmitHooks = {},
  ): Promise<void> =>
    coreEmitWithAck(namespace, event, payload, ackEvent, retries, hooks);

  return { getSocket, disconnect, emitWithAck };
}
