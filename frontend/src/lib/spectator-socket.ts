import type { Socket } from 'socket.io-client';
import type { GameState } from '@shared/types';
import { createGameNamespace } from './socket-namespaces';

const { getSocket: getSpectatorSocket, disconnect } =
  createGameNamespace('spectate');

export function subscribeToTable(
  tableId: string,
  handler: (state: GameState) => void,
): () => void {
  let s: Socket;
  const join = () => s.emit('join', { tableId });
  s = getSpectatorSocket({ onConnect: join });
  if (s.connected) {
    join();
  }
  s.on('state', handler);
  return () => {
    s.emit('leave', { tableId });
    s.off('state', handler);
  };
}

export function disconnectSpectatorSocket(): void {
  disconnect();
}
