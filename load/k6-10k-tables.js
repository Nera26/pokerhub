import ws from 'k6/ws';
import http from 'k6/http';
import { Trend, Rate } from 'k6/metrics';
import { sleep } from 'k6';

// Drive 80k sockets across 10k tables while capturing ACK latency.
// In CI we default to a smaller scenario to avoid overwhelming runners.
const ci = !!__ENV.CI;
const defaultSockets = ci ? 100 : 80000;
const defaultTables = ci ? 100 : 10000;
const defaultDuration = ci ? '1m' : '5m';

export const options = {
  vus: Number(__ENV.SOCKETS) || defaultSockets,
  duration: __ENV.DURATION || defaultDuration,
  thresholds: {
    ack_latency: [
      `p(95)<${__ENV.ACK_P95_MS || 120}`,
      `p(99)<${__ENV.ACK_P99_MS || 200}`,
    ],
    error_rate: [`rate<${__ENV.ERROR_RATE_MAX || 0.01}`],
  },
};

const tables = Number(__ENV.TABLES) || defaultTables;
const loss = Number(__ENV.PACKET_LOSS) || 0.05; // 5% packet loss
const jitterMs = Number(__ENV.JITTER_MS) || 200; // client-side jitter before sending

const grafanaPushUrl = __ENV.GRAFANA_PUSH_URL;
const ACK_LATENCY = new Trend('ack_latency', true);
const ERROR_RATE = new Rate('error_rate');

export default function () {
  const tableId = __VU % tables;
  const url = `${__ENV.WS_URL || 'ws://localhost:3001'}?table=${tableId}`;

  ws.connect(url, function (socket) {
    let start = 0;
    let acked = false;

    socket.on('open', function () {
      // inject client side jitter
      sleep(Math.random() * jitterMs / 1000);
      start = Date.now();
      if (Math.random() > loss) {
        socket.send('action');
      }
    });

    socket.on('message', function () {
      acked = true;
      ACK_LATENCY.add(Date.now() - start);
      ERROR_RATE.add(0);
      socket.close();
    });

    socket.on('error', function (e) {
      if (!acked) {
        ERROR_RATE.add(1);
        acked = true;
      }
      console.error('socket error', e);
    });

    socket.setTimeout(function () {
      // close if no ack
      if (!acked) {
        ERROR_RATE.add(1);
        acked = true;
      }
      socket.close();
    }, 1000);
  });
}

export function handleSummary(data) {
  const hist = data.metrics.ack_latency?.histogram || data.metrics.ack_latency?.bins || {};
  const p95 = data.metrics.ack_latency?.values?.['p(95)'] || 0;
  const drop = data.metrics.error_rate?.rate || 0;
  if (grafanaPushUrl) {
    const body = `ack_latency_p95_ms ${p95}\nerror_rate ${drop}\n`;
    http.post(`${grafanaPushUrl}/metrics/job/k6-10k-tables`, body, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return {
    'ack-histogram.json': JSON.stringify(hist, null, 2),
  };
}
