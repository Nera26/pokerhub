import type { Socket } from 'socket.io-client';
import { type GameActionPayload } from '@shared/types';
import { GameActionSchema } from '@shared/schemas/game';
import { EVENT_SCHEMA_VERSION } from '@shared/events';
import { setServerTime } from './server-time';
import { createNamespaceSocket } from './socket-namespace';

const {
  getSocket: getNamespaceSocket,
  disconnect,
  emitWithAck,
} = createNamespaceSocket('game');

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

function emitWithPending(
  event: string,
  payload: Record<string, unknown>,
  ackEvent: string,
  retries = 1,
): Promise<void> {
  return emitWithAck(event, payload, ackEvent, retries, {
    onSend: (fullPayload) => {
      if (event === 'action') {
        pending = { event, payload: fullPayload, ackEvent };
      }
    },
    onCleanup: (actionId) => {
      if (pending?.payload.actionId === actionId) {
        pending = null;
      }
    },
  });
}

export function sendAction(action: GameActionPayload, retries = 1) {
  const payload = { version: EVENT_SCHEMA_VERSION, ...action };
  GameActionSchema.parse(payload);
  return emitWithPending('action', payload, 'action:ack', retries);
}

export const join = () => emitWithPending('join', {}, 'join:ack');
export const buyIn = () => emitWithPending('buy-in', {}, 'buy-in:ack');
export const sitOut = () => emitWithPending('sitout', {}, 'sitout:ack');
export const rebuy = () => emitWithPending('rebuy', {}, 'rebuy:ack');
