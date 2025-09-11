import type { Socket } from 'socket.io-client';
import { type GameActionPayload } from '@shared/types';
import { GameActionSchema } from '@shared/schemas/game';
import { EVENT_SCHEMA_VERSION } from '@shared/events';
import { setServerTime } from './server-time';
import { createGameNamespace } from './socket-namespaces';

const {
  getSocket: getNamespaceSocket,
  disconnect,
  emitWithAck,
} = createGameNamespace('game');

let initialized = false;
let lastTick = 0;

interface PendingAction {
  event: string;
  payload: Record<string, unknown>;
  ackEvent: string;
}

let pending: PendingAction | null = null;

function onConnect() {
  const s = getNamespaceSocket();
  if (pending) {
    s.emit(pending.event, pending.payload);
  }
  s.emit('resume', { tick: lastTick });
}

export function getGameSocket(): Socket {
  const s = getNamespaceSocket({ onConnect });
  if (!initialized) {
    s.on('state', (state: { tick?: number; version?: string }) => {
      if (state.version !== EVENT_SCHEMA_VERSION) return;
      if (typeof state.tick === 'number') {
        lastTick = state.tick;
      }
    });

    s.on('server:Clock', (serverNow: number) => {
      setServerTime(serverNow);
    });
    initialized = true;
  }
  return s;
}

export function disconnectGameSocket(): void {
  if (initialized) {
    const s = getNamespaceSocket();
    s.off('state');
    s.off('server:Clock');
    disconnect();
    initialized = false;
  }
}

export function sendAction(action: GameActionPayload, retries = 1) {
  const payload = { version: EVENT_SCHEMA_VERSION, ...action };
  GameActionSchema.parse(payload);
  return emitWithAck('action', payload, 'action:ack', retries, {
    onSend: (fullPayload) => {
      pending = {
        event: 'action',
        payload: fullPayload,
        ackEvent: 'action:ack',
      };
    },
    onCleanup: (actionId) => {
      if (pending?.payload.actionId === actionId) {
        pending = null;
      }
    },
  });
}
