import { Trend, Rate, Counter } from 'k6/metrics';
import { runSocket } from './lib/runSocket.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { setupMetrics, teardownMetrics, pushSummary } from './lib/wsMetrics.js';

const ACK_LATENCY = new Trend('ack_latency', true);
const ACK_SUCCESS = new Rate('ack_success');
const ACTION_COUNTER = new Counter('actions');

const TABLES = Number(__ENV.TABLES) || 10000;
const ACTIONS_PER_MIN_THRESHOLD = Number(__ENV.ACTIONS_PER_MIN_THRESHOLD) || 150;

const thresholds = {
  ack_latency: [
    `p(50)<${__ENV.ACK_P50_MS || 40}`,
    `p(95)<${__ENV.ACK_P95_MS || 120}`,
    `p(99)<${__ENV.ACK_P99_MS || 200}`,
  ],
  ack_success: [`rate>${__ENV.ACK_SUCCESS_RATE || 0.99}`],
  rss_growth: ['p(100)<1'],
  gc_pause: ['p(95)<50'],
};

for (let i = 0; i < TABLES; i++) {
  thresholds[`ack_latency{table:${i}}`] = [
    `p(50)<${__ENV.ACK_P50_MS || 40}`,
    `p(95)<${__ENV.ACK_P95_MS || 120}`,
    `p(99)<${__ENV.ACK_P99_MS || 200}`,
  ];
  thresholds[`actions{table:${i}}`] = [`rate>=${(ACTIONS_PER_MIN_THRESHOLD / 60).toFixed(2)}`];
}

export const options = {
  vus: Number(__ENV.SOCKETS) || 80000,
  duration: __ENV.DURATION || '1m',
  thresholds,
};

export const setup = () => setupMetrics(__ENV.METRICS_URL);

export default function () {
  const tableId = (__VU - 1) % TABLES;
  const url = __ENV.SIO_URL || 'ws://localhost:4000/game';

  runSocket(url, tableId, ACK_SUCCESS, (socket, action) => {
    const start = Date.now();
    socket.emit('action', action, () => {
      ACK_LATENCY.add(Date.now() - start, { table: tableId });
      ACK_SUCCESS.add(1);
      ACTION_COUNTER.add(1, { table: tableId });
    });
  });
}

export const teardown = (data) => teardownMetrics(__ENV.METRICS_URL, data);

export function handleSummary(data) {
  const parseTable = (key) => {
    let table = key;
    try {
      table = JSON.parse(key).table;
    } catch (e) {
      const m = key.match(/table:?"?(\d+)/);
      if (m) table = m[1];
    }
    return table;
  };

  const actionSub = (data.metrics.actions && data.metrics.actions.submetrics) || {};
  const latencySub =
    (data.metrics.ack_latency && data.metrics.ack_latency.submetrics) || {};
  const tables = {};
  const summaries = pushSummary(data, { latencyMetric: 'ack_latency' });

  for (const key of Object.keys(actionSub)) {
    const table = parseTable(key);
    const rate = actionSub[key].values.rate || 0;
    tables[table] = {
      tps: rate,
      actions_per_minute: rate * 60,
    };
  }

  for (const key of Object.keys(latencySub)) {
    const table = parseTable(key);
    const vals = latencySub[key].values;
    const p50 = vals['p(50)'] || vals.median || 0;
    const p95 = vals['p(95)'] || 0;
    const p99 = vals['p(99)'] || 0;
    tables[table] = {
      ...(tables[table] || {}),
      ack_latency: { p50, p95, p99 },
    };
  }

  data.tables = tables;
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'load/results/k6-swarm-summary.json': JSON.stringify({ tables }, null, 2),
    ...summaries,
  };
}
