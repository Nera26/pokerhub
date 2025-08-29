import ws from 'k6/ws';
import http from 'k6/http';
import { Trend, Counter } from 'k6/metrics';
import { sleep } from 'k6';

const ACK_LATENCY = new Trend('ack_latency', true);
const DROPPED_FRAMES = new Counter('dropped_frames');
const RATE_LIMIT_ERRORS = new Counter('rate_limit_errors');

export const options = {
  vus: Number(__ENV.SOCKETS || 80000),
  duration: __ENV.DURATION || '5m',
  thresholds: {
    ack_latency: [`p(95)<${__ENV.ACK_P95_MS || 120}`],
  },
};

export default function () {
  const tables = Number(__ENV.TABLES || 10000);
  const actionsPerMin = Number(__ENV.ACTIONS_PER_MIN || 6000);
  const url = __ENV.WS_URL || 'ws://localhost:3001';
  const loss = Number(__ENV.PACKET_LOSS || 0.05);
  const jitterMs = Number(__ENV.JITTER_MS || 200);
  const ackTimeout = Number(__ENV.ACK_TIMEOUT_MS || 1000);

  ws.connect(`${url}?table=${__VU % tables}`, function (socket) {
    const intervalMs = 60000 / actionsPerMin;

    socket.on('open', function () {
      socket.setInterval(function () {
        let acked = false;
        const start = Date.now();
        const handler = (msg) => {
          acked = true;
          if (String(msg).includes('rate limit exceeded')) {
            RATE_LIMIT_ERRORS.add(1);
          } else {
            ACK_LATENCY.add(Date.now() - start);
          }
          socket.off('message', handler);
        };
        socket.on('message', handler);
        sleep(Math.random() * jitterMs / 1000);
        if (Math.random() > loss) {
          socket.send('action');
        }
        socket.setTimeout(function () {
          if (!acked) {
            DROPPED_FRAMES.add(1);
            socket.off('message', handler);
          }
        }, ackTimeout);
      }, intervalMs);
    });

    socket.setTimeout(function () {
      socket.close();
    }, Number(__ENV.SOCKET_TTL_MS || 60000));
  });
}

export function handleSummary(data) {
  const url = __ENV.CLICKHOUSE_URL;
  if (url) {
    const table = __ENV.CLICKHOUSE_TABLE || 'ws_ack_latency';
    const payload = {
      ts: new Date().toISOString(),
      p50: data.metrics.ack_latency['p(50)'],
      p95: data.metrics.ack_latency['p(95)'],
      p99: data.metrics.ack_latency['p(99)'],
      dropped_frames: data.metrics.dropped_frames?.count || 0,
    };
    http.post(
      `${url}?query=INSERT INTO ${table} FORMAT JSONEachRow`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
  return {};
}
