import type { Socket } from 'socket.io-client';
import { GameActionSchema, type GameActionPayload } from '@shared/types';
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

    socket.on('state', (state: { tick?: number }) => {
      if (typeof state.tick === 'number') {
        lastTick = state.tick;
      }
    });

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

  return new Promise<void>((resolve) => {
    const handler = (ack: { actionId: string }) => {
      if (ack?.actionId === actionId) {
        s.off(ackEvent, handler);
        if (pending?.payload.actionId === actionId) {
          pending = null;
        }
        resolve();
      }
    };
    s.on(ackEvent, handler);
    s.emit(event, fullPayload);
  });
}

export function sendAction(action: GameActionPayload) {
  const payload = { version: '1', ...action };
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

