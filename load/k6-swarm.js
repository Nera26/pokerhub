import { Trend, Rate, Counter } from 'k6/metrics';
import { io } from 'k6/x/socket.io';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const ACTIONS = JSON.parse(open('../backend/src/game/engine/gateway.actions.json'));

const ACK_LATENCY = new Trend('ack_latency', true);
const ACK_SUCCESS = new Rate('ack_success');
const ACTION_COUNTER = new Counter('actions');

const TABLES = Number(__ENV.TABLES) || 10000;
const TPS_THRESHOLD = Number(__ENV.TPS_THRESHOLD) || 150;

const thresholds = {
  ack_latency: [
    `p(95)<${__ENV.ACK_P95_MS || 200}`,
    `p(99)<${__ENV.ACK_P99_MS || 400}`,
  ],
  ack_success: [`rate>${__ENV.ACK_SUCCESS_RATE || 0.99}`],
};

for (let i = 0; i < TABLES; i++) {
  thresholds[`actions{table:${i}}`] = [`rate>=${TPS_THRESHOLD}`];
}

export const options = {
  vus: Number(__ENV.SOCKETS) || 80000,
  duration: __ENV.DURATION || '1m',
  thresholds,
};

export default function () {
  const tableId = (__VU - 1) % TABLES;
  const url = __ENV.SIO_URL || 'ws://localhost:3000/game';

  const socket = io(url, {
    query: { table: tableId },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    for (const action of ACTIONS) {
      const start = Date.now();
      socket.emit('action', action, () => {
        ACK_LATENCY.add(Date.now() - start);
        ACK_SUCCESS.add(1);
        ACTION_COUNTER.add(1, { table: tableId });
      });
    }
    socket.disconnect();
  });

  socket.on('connect_error', () => {
    ACK_SUCCESS.add(0);
  });
}

export function handleSummary(data) {
  const sub = data.metrics.actions?.submetrics || {};
  const tables = {};
  for (const key of Object.keys(sub)) {
    let table = key;
    try {
      table = JSON.parse(key).table;
    } catch (e) {
      const m = key.match(/table:?"?(\d+)/);
      if (m) table = m[1];
    }
    const rate = sub[key].values.rate || 0;
    tables[table] = {
      tps: rate,
      actions_per_minute: rate * 60,
    };
  }
  data.tables = tables;
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'load/results/k6-swarm-summary.json': JSON.stringify({ tables }, null, 2),
  };
}
