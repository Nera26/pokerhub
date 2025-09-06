import { Trend, Rate } from 'k6/metrics';
import { io } from 'k6/x/socket.io';
import { Random } from 'https://jslib.k6.io/random/1.0.0/index.js';
import { setupSocketProxy } from '../lib/socket-stress.js';

// Chaos scenario targeting 80k sockets spread across 10k tables.
const ACTIONS = JSON.parse(open('../../backend/src/game/engine/gateway.actions.json'));
const seed = Number(__ENV.RNG_SEED) || 1;

const LATENCY = new Trend('latency', true);
const DROPPED_FRAMES = new Rate('dropped_frames');

export const options = {
  vus: Number(__ENV.SOCKETS) || 80000,
  duration: __ENV.DURATION || '1m',
  thresholds: {
    latency: [`p(95)<${__ENV.P95_MS || 120}`],
    dropped_frames: [`rate<${__ENV.MAX_DROPPED || 0.01}`],
  },
};

export { setupSocketProxy as setup };

export default function (data) {
  const tables = Number(__ENV.TABLES) || 10000;
  const rng = new Random(seed + __VU);
  const tableId = Math.floor(rng.nextFloat() * tables);
  const url = data.wsUrl || 'ws://localhost:4000/game';

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

export function handleSummary(data) {
  const latHist = data.metrics.latency?.histogram || data.metrics.latency?.bins || {};
  return {
    'metrics/latency-histogram.json': JSON.stringify(latHist, null, 2),
    'metrics/seeds.json': JSON.stringify({ runSeed: seed }, null, 2),
  };
}
