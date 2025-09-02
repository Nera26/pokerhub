import ws from 'k6/ws';
import { Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const ACK_LATENCY = new Trend('ack_latency', true);
const RATE_LIMIT_ERRORS = new Counter('rate_limit_errors');
const ACTION_COUNTER = new Counter('table_actions');

const TABLES = Number(__ENV.TABLES || 10);
const thresholds = {
  ack_latency: [
    `p(50)<${__ENV.ACK_P50_MS || 40}`,
    `p(95)<${__ENV.ACK_P95_MS || 120}`,
    `p(99)<${__ENV.ACK_P99_MS || 200}`,
  ],
  table_actions: ['rate>2.5'],
};
for (let i = 0; i < TABLES; i++) {
  thresholds[`table_actions{table:${i}}`] = ['rate>2.5'];
}

export const options = {
  vus: Number(__ENV.SOCKETS || 50),
  duration: __ENV.DURATION || '1m',
  thresholds,
};

export default function () {
  const actionsPerMin = Number(__ENV.ACTIONS_PER_MIN || 6000);
  const url = __ENV.WS_URL || 'ws://localhost:4000/game';
  const tableId = __VU % TABLES;

  ws.connect(`${url}?table=${tableId}`, function (socket) {
    const intervalMs = 60000 / actionsPerMin;

    socket.on('open', function () {
      socket.setInterval(function () {
        const start = Date.now();
        const handler = (msg) => {
          if (String(msg).includes('rate limit exceeded')) {
            RATE_LIMIT_ERRORS.add(1);
          } else {
            ACK_LATENCY.add(Date.now() - start);
            ACTION_COUNTER.add(1, { table: tableId });
          }
          socket.off('message', handler);
        };
        socket.on('message', handler);
        socket.send('action');
      }, intervalMs);
    });

    socket.setTimeout(function () {
      socket.close();
    }, Number(__ENV.SOCKET_TTL_MS || 60000));
  });
}

export function handleSummary(data) {
  const sub = data.metrics.table_actions?.submetrics || {};
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
    tables[table] = { actions_per_minute: rate * 60 };
  }
  data.tables = tables;
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'load/results/k6-table-actions-summary.json': JSON.stringify({ tables }, null, 2),
  };
}
