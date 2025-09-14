import { io } from 'k6/x/socket.io';

const ACTIONS = JSON.parse(
  open('../../backend/src/game/engine/gateway.actions.json')
);

export function runSocket(url, tableId, ackSuccess, onEmit) {
  const socket = io(url, {
    query: { table: tableId },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    for (const action of ACTIONS) {
      onEmit(socket, action);
    }
    socket.disconnect();
  });

  socket.on('connect_error', () => {
    ackSuccess.add(0);
  });
}
