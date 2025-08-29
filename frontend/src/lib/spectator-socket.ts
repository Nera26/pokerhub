import type { Socket } from 'socket.io-client';
import type { GameState } from '@shared/types';
import { getSocket, disconnectSocket } from '@/app/utils/socket';

let socket: Socket | null = null;

function ensureSocket(): Socket {
  if (!socket) {
    socket = getSocket({ namespace: 'spectate' });
  }
  return socket;
}

export function subscribeToTable(
  tableId: string,
  handler: (state: GameState) => void,
): () => void {
  const s = ensureSocket();
  const join = () => s.emit('join', { tableId });
  if (s.connected) {
    join();
  } else {
    s.once('connect', join);
  }
  s.on('state', handler);
  return () => {
    s.emit('leave', { tableId });
    s.off('state', handler);
  };
}

export function disconnectSpectatorSocket(): void {
  if (socket) {
    socket.off('state');
    disconnectSocket('spectate');
    socket = null;
  }
}

