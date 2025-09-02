import { Trend, Rate, Counter } from 'k6/metrics';
import http from 'k6/http';
import { io } from 'k6/x/socket.io';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const ACTIONS = JSON.parse(open('../backend/src/game/engine/gateway.actions.json'));

const ACK_LATENCY = new Trend('ack_latency', true);
const ACK_SUCCESS = new Rate('ack_success');
const ACTION_COUNTER = new Counter('actions');
const RSS_GROWTH = new Trend('rss_growth');
const GC_PAUSE = new Trend('gc_pause');

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

export function setup() {
  const url = __ENV.METRICS_URL;
  if (!url) return {};
  try {
    const res = http.get(url);
    const data = res.json();
    if (data.rssBytes !== undefined) {
      return { startRss: data.rssBytes };
    }
  } catch (e) {
    // ignore parse errors
  }
  return {};
}

export default function () {
  const tableId = (__VU - 1) % TABLES;
  const url = __ENV.SIO_URL || 'ws://localhost:4000/game';

  const socket = io(url, {
    query: { table: tableId },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    for (const action of ACTIONS) {
      const start = Date.now();
      socket.emit('action', action, () => {
        ACK_LATENCY.add(Date.now() - start, { table: tableId });
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

export function teardown(data) {
  const url = __ENV.METRICS_URL;
  if (!url) return;
  let end;
  try {
    const res = http.get(url);
    end = res.json();
  } catch (e) {
    return;
  }
  if (end.rssDeltaPct !== undefined) {
    RSS_GROWTH.add(end.rssDeltaPct);
  } else if (data.startRss && end.rssBytes !== undefined) {
    const growth = ((end.rssBytes - data.startRss) / data.startRss) * 100;
    RSS_GROWTH.add(growth);
  }
  if (end.gcPauseP95 !== undefined) {
    GC_PAUSE.add(end.gcPauseP95);
  }
}

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

  const actionSub = data.metrics.actions?.submetrics || {};
  const latencySub = data.metrics.ack_latency?.submetrics || {};
  const tables = {};
  const latencyHist =
    data.metrics.ack_latency?.histogram ||
    data.metrics.ack_latency?.bins ||
    {};
  const gcHist = data.metrics.gc_pause?.histogram || data.metrics.gc_pause?.bins || {};
  const heapHist =
    data.metrics.rss_growth?.histogram ||
    data.metrics.rss_growth?.bins ||
    {};

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
    'metrics/latency-histogram.json': JSON.stringify(latencyHist, null, 2),
    'metrics/gc-histogram.json': JSON.stringify(gcHist, null, 2),
    'metrics/heap-histogram.json': JSON.stringify(heapHist, null, 2),
  };
}
