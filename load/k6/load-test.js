import { Trend, Rate } from 'k6/metrics';
import { io } from 'k6/x/socket.io';

const ACTIONS = JSON.parse(open('../../backend/src/game/engine/gateway.actions.json'));

const LATENCY = new Trend('latency', true);
const DROPPED_FRAMES = new Rate('dropped_frames');

export const options = {
  vus: Number(__ENV.SOCKETS) || 100000,
  duration: __ENV.DURATION || '1m',
  thresholds: {
    latency: [`p(95)<${__ENV.P95_MS || 120}`],
    dropped_frames: [`rate<${__ENV.MAX_DROPPED || 0.01}`],
  },
};

export default function () {
  const tables = Number(__ENV.TABLES) || 10000;
  const tableId = (__VU - 1) % tables;
  const url = __ENV.SIO_URL || 'ws://localhost:4000/game';

  const socket = io(url, {
    query: { table: tableId },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    for (const action of ACTIONS) {
      const start = Date.now();
      socket.emit('action', action, () => {
        LATENCY.add(Date.now() - start);
        DROPPED_FRAMES.add(0);
      });
    }
    socket.disconnect();
  });

  socket.on('connect_error', () => {
    DROPPED_FRAMES.add(1);
  });
}
