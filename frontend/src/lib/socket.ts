/* istanbul ignore file */
import { GameActionSchema, type GameActionPayload } from '@shared/types';
import { env } from './env';

let socket: WebSocket | null = null;

interface Pending {
  resolve: () => void;
  reject: (err: Error) => void;
  event: string;
  attempts: number;
  timeout: ReturnType<typeof setTimeout>;
  message: Record<string, unknown>;
}

const pendingAcks = new Map<string, Pending>();
const MAX_ATTEMPTS = 5;

function getWsUrl(): string {
  const base = env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';
  const url = base.replace(/^http/, 'ws');
  return `${url}/game`;
}

async function getSocket(): Promise<WebSocket> {
  if (typeof window === 'undefined') {
    throw new Error('WebSocket is not available on the server');
  }
  if (socket && socket.readyState === WebSocket.OPEN) return socket;
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    socket = new WebSocket(getWsUrl());
    socket.addEventListener('message', handleMessage);
  }
  if (socket.readyState === WebSocket.CONNECTING) {
    await new Promise<void>((resolve) => {
      socket?.addEventListener('open', () => resolve(), { once: true });
    });
    return socket!;
  }
  return new Promise<WebSocket>((resolve) => {
    socket!.addEventListener('open', () => resolve(socket!), { once: true });
  });
}

function handleMessage(ev: MessageEvent) {
  let data: any;
  try {
    data = JSON.parse(ev.data);
  } catch {
    return;
  }
  const { type, actionId } = data ?? {};
  if (typeof type !== 'string' || typeof actionId !== 'string') return;
  const pending = pendingAcks.get(actionId);
  if (pending && `${pending.event}:ack` === type) {
    clearTimeout(pending.timeout);
    pending.resolve();
    pendingAcks.delete(actionId);
  }
}

async function sendWithAck(event: string, payload: Record<string, unknown>): Promise<void> {
  if (typeof window === 'undefined') return;
  const ws = await getSocket();
  const actionId = crypto.randomUUID();
  const message = { ...payload, type: event, actionId };

  return new Promise<void>((resolve, reject) => {
    const pending: Pending = {
      resolve,
      reject,
      event,
      attempts: 0,
      timeout: setTimeout(() => {}, 0),
      message,
    };
    pendingAcks.set(actionId, pending);

    const send = () => {
      pending.attempts += 1;
      ws.send(JSON.stringify(message));
      pending.timeout = setTimeout(() => {
        if (pending.attempts >= MAX_ATTEMPTS) {
          pendingAcks.delete(actionId);
          reject(new Error('ACK timeout'));
          return;
        }
        send();
      }, Math.pow(2, pending.attempts) * 100);
    };

    send();
  });
}

export function joinTable(tableId: string) {
  return sendWithAck('join', { tableId });
}

export function buyIn(tableId: string, amount: number) {
  return sendWithAck('buy-in', { tableId, amount });
}

export function sitOut(tableId: string) {
  return sendWithAck('sitout', { tableId });
}

export function rebuy(tableId: string, amount: number) {
  return sendWithAck('rebuy', { tableId, amount });
}

export function sendAction(action: GameActionPayload) {
  const payload = { version: '1', ...action };
  GameActionSchema.parse(payload);
  return sendWithAck('action', payload);
}

export function bet(tableId: string, playerId: string, amount: number) {
  return sendAction({ type: 'bet', tableId, playerId, amount });
}

export function raise(tableId: string, playerId: string, amount: number) {
  return sendAction({ type: 'raise', tableId, playerId, amount });
}
