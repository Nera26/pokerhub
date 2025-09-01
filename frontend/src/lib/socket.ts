import type { Socket } from 'socket.io-client';
import { GameActionSchema, type GameActionPayload } from '@shared/types';
import { EVENT_SCHEMA_VERSION } from '@shared/events';
import { dispatchGlobalError } from '@/hooks/useApiError';
import { setServerTime } from './server-time';
import { getSocket, disconnectSocket } from '../app/utils/socket';

let socket: Socket | null = null;
let lastTick = 0;

interface PendingAction {
  event: string;
  payload: Record<string, unknown>;
  ackEvent: string;
}

let pending: PendingAction | null = null;

function ensureSocket(): Socket {
  if (!socket) {
    socket = getSocket({ namespace: 'game' });

    socket.on('state', (state: { tick?: number; version?: string }) => {
      if (state.version !== EVENT_SCHEMA_VERSION) return;
      if (typeof state.tick === 'number') {
        lastTick = state.tick;
      }
    });

    socket.on(
      'server:StateDelta',
      (delta: { tick?: number; version?: string }) => {
        if (delta.version !== EVENT_SCHEMA_VERSION) return;
        if (typeof delta.tick === 'number') {
          lastTick = delta.tick;
        }
      },
    );

    socket.on('server:Clock', (serverNow: number) => {
      setServerTime(serverNow);
    });

    socket.on('connect', () => {
      if (pending) {
        socket!.emit(pending.event, pending.payload);
      }
      socket!.emit('resume', { tick: lastTick });
    });
  }
  return socket;
}

export function getGameSocket(): Socket {
  return ensureSocket();
}

export function disconnectGameSocket(): void {
  if (socket) {
    socket.off('state');
    socket.off('server:StateDelta');
    socket.off('server:Clock');
    socket.off('connect');
    disconnectSocket('game');
    socket = null;
  }
}

function emitWithAck(
  event: string,
  payload: Record<string, unknown>,
  ackEvent: string,
  retries = 1,
): Promise<void> {
  const s = ensureSocket();
  const actionId =
    (payload.actionId as string | undefined) ??
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Date.now().toString());
  const fullPayload = { ...payload, actionId };

  if (event === 'action') {
    pending = { event, payload: fullPayload, ackEvent };
  }

  return new Promise<void>((resolve, reject) => {
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timer);
      s.off(ackEvent, handler);
      if (pending?.payload.actionId === actionId) {
        pending = null;
      }
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

    const send = () => {
      s.emit(event, fullPayload);
      timer = setTimeout(() => {
        if (attempts < retries) {
          attempts++;
          send();
        } else {
          fail();
        }
      }, 2000);
    };

    s.on(ackEvent, handler);
    send();
  });
}

export function sendAction(action: GameActionPayload) {
  const payload = { version: EVENT_SCHEMA_VERSION, ...action };
  GameActionSchema.parse(payload);
  return emitWithAck('action', payload, 'action:ack');
}

export const join = () => emitWithAck('join', {}, 'join:ack');
export const buyIn = () => emitWithAck('buy-in', {}, 'buy-in:ack');
export const sitOut = () => emitWithAck('sitout', {}, 'sitout:ack');
export const rebuy = () => emitWithAck('rebuy', {}, 'rebuy:ack');

export const bet = (
  tableId: string,
  playerId: string,
  amount: number,
) => sendAction({ type: 'bet', tableId, playerId, amount });

export const raise = (
  tableId: string,
  playerId: string,
  amount: number,
) => sendAction({ type: 'raise', tableId, playerId, amount });

