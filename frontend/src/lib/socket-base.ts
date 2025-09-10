import type { Socket } from 'socket.io-client';
import { dispatchGlobalError } from '@/hooks/useApiError';
import {
  getSocket as baseGetSocket,
  disconnectSocket,
} from '@/app/utils/socket';

type GetSocketOptions = Parameters<typeof baseGetSocket>[0];

interface EmitHooks {
  onSend?: (payload: Record<string, unknown>, actionId: string) => void;
  onCleanup?: (actionId: string) => void;
}

export function createNamespaceSocket(namespace: string) {
  let socket: Socket | null = null;

  const getSocket = (options: GetSocketOptions = {}): Socket => {
    socket = baseGetSocket({ namespace, ...options }) as Socket;
    return socket;
  };

  const disconnect = (): void => {
    if (socket) {
      disconnectSocket(namespace);
      socket = null;
    }
  };

  function emitWithAck(
    event: string,
    payload: Record<string, unknown>,
    ackEvent: string,
    retries = 1,
    hooks: EmitHooks = {},
  ): Promise<void> {
    const s = getSocket();
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
        s.off(ackEvent, handler);
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
        s.emit(event, fullPayload);
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

      s.on(ackEvent, handler);
      send();
    });
  }

  return { getSocket, disconnect, emitWithAck };
}
