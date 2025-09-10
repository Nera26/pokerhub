import { createNamespaceSocket } from './socket-base';
import type { EmitHooks } from './socket-core';
import type { SocketOptions } from './socket-core';

export function createGameNamespace(
  name: string,
  defaultHooks: EmitHooks = {},
) {
  const { getSocket, disconnect, emitWithAck } = createNamespaceSocket(name);

  const emit = (
    event: string,
    payload: Record<string, unknown>,
    ackEvent: string,
    retries = 1,
    hooks: EmitHooks = {},
  ) =>
    emitWithAck(event, payload, ackEvent, retries, {
      onSend: (p, actionId) => {
        defaultHooks.onSend?.(p, actionId);
        hooks.onSend?.(p, actionId);
      },
      onCleanup: (actionId) => {
        defaultHooks.onCleanup?.(actionId);
        hooks.onCleanup?.(actionId);
      },
    });

  const get = (options: SocketOptions = {}) => getSocket(options);

  return { getSocket: get, disconnect, emitWithAck: emit };
}

export type { EmitHooks } from './socket-core';
