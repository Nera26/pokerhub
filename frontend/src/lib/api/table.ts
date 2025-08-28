import { z } from 'zod';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse } from './client';
import { serverFetch } from '@/lib/server-fetch';
import { getSocket } from '@/app/utils/socket';
import { GameActionSchema, type GameAction } from '@shared/types';

const PlayerSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string(),
  chips: z.number(),
  committed: z.number().optional(),
  isActive: z.boolean().optional(),
  isFolded: z.boolean().optional(),
  sittingOut: z.boolean().optional(),
  isAllIn: z.boolean().optional(),
  isWinner: z.boolean().optional(),
  timeLeft: z.number().optional(),
  cards: z.array(z.string()).optional(),
  pos: z.string().optional(),
  lastAction: z.string().optional(),
});

const ChatMessageSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string(),
  text: z.string(),
  time: z.string(),
});

const TableDataSchema = z.object({
  smallBlind: z.number(),
  bigBlind: z.number(),
  pot: z.number(),
  communityCards: z.array(z.string()),
  players: z.array(PlayerSchema),
  chatMessages: z.array(ChatMessageSchema),
});
export type TableData = z.infer<typeof TableDataSchema>;

export async function fetchTable(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<TableData> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/tables/${id}`, {
    credentials: 'include',
    signal,
    cache: 'no-store',
  });
  return handleResponse(res, TableDataSchema);
}

interface ActionAck {
  actionId: string;
  duplicate?: boolean;
}

async function emitWithAck(event: string, data: Record<string, unknown>) {
  const socket = getSocket();
  const actionId = crypto.randomUUID();
  const payload = { ...data, actionId };
  let attempt = 0;
  const maxAttempts = 5;

  return new Promise<void>((resolve, reject) => {
    function handleAck(ack: ActionAck) {
      if (ack.actionId === actionId) {
        socket.off(`${event}:ack`, handleAck);
        clearTimeout(timeoutId);
        resolve();
      }
    }

    function send() {
      attempt++;
      socket.emit(event, payload);
      const delay = Math.pow(2, attempt) * 100;
      timeoutId = setTimeout(() => {
        if (attempt >= maxAttempts) {
          socket.off(`${event}:ack`, handleAck);
          reject(new Error('ACK timeout'));
          return;
        }
        send();
      }, delay);
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    socket.on(`${event}:ack`, handleAck);
    send();
  });
}

async function sendAction(action: GameAction) {
  GameActionSchema.parse(action);
  const socket = getSocket();
  const actionId = crypto.randomUUID();
  const payload = { ...action, actionId };
  let attempt = 0;
  const maxAttempts = 5;

  return new Promise<void>((resolve, reject) => {
    function handleAck(ack: ActionAck) {
      if (ack.actionId === actionId) {
        socket.off('action:ack', handleAck);
        clearTimeout(timeoutId);
        resolve();
      }
    }

    function send() {
      attempt++;
      socket.emit('action', payload);
      const delay = Math.pow(2, attempt) * 100;
      timeoutId = setTimeout(() => {
        if (attempt >= maxAttempts) {
          socket.off('action:ack', handleAck);
          reject(new Error('ACK timeout'));
          return;
        }
        send();
      }, delay);
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    socket.on('action:ack', handleAck);
    send();
  });
}

export function joinTable(tableId: string) {
  return emitWithAck('join', { tableId });
}

export function bet(tableId: string, playerId: string, amount: number) {
  return sendAction({ type: 'bet', tableId, playerId, amount });
}

export function buyIn(tableId: string, amount: number) {
  return emitWithAck('buy-in', { tableId, amount });
}

export function sitOut(tableId: string) {
  return emitWithAck('sitout', { tableId });
}

export function rebuy(tableId: string, amount: number) {
  return emitWithAck('rebuy', { tableId, amount });
}
