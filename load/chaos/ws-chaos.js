import { Trend, Rate } from 'k6/metrics';
import { io } from 'k6/x/socket.io';
import http from 'k6/http';
import { Random } from 'https://jslib.k6.io/random/1.0.0/index.js';

// Chaos scenario targeting 80k sockets spread across 10k tables.
const ACTIONS = JSON.parse(open('../../backend/src/game/engine/gateway.actions.json'));
const seed = Number(__ENV.RNG_SEED) || 1;
const LATENCY_MS = Number(__ENV.LATENCY_MS || 200);
const JITTER_MS = Number(__ENV.JITTER_MS || 200);
const PACKET_LOSS = Number(__ENV.PACKET_LOSS || 0.05);

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

export function setup() {
  const host = __ENV.TOXIPROXY_URL || 'http://localhost:8474';
  const name = __ENV.TOXIPROXY_NAME || 'pokerhub_ws';
  const listen = `0.0.0.0:${__ENV.PROXY_PORT || '3001'}`;
  const upstream = __ENV.UPSTREAM || 'localhost:4000';
  try {
    http.del(`${host}/proxies/${name}`);
  } catch (e) {
    /* ignore */
  }
  http.post(
    `${host}/proxies`,
    JSON.stringify({ name, listen, upstream }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  try {
    http.del(`${host}/proxies/${name}/toxics/all`);
  } catch (e) {
    /* ignore */
  }
  http.post(
    `${host}/proxies/${name}/toxics`,
    JSON.stringify({
      name: 'latency',
      type: 'latency',
      attributes: { latency: LATENCY_MS, jitter: JITTER_MS },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  http.post(
    `${host}/proxies/${name}/toxics`,
    JSON.stringify({
      name: 'packet_loss',
      type: 'timeout',
      attributes: { timeout: 1 },
      toxicity: PACKET_LOSS,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return { wsUrl: `ws://localhost:${__ENV.PROXY_PORT || '3001'}/game` };
}

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
