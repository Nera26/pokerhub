import ws from 'k6/ws';
import { Trend, Rate } from 'k6/metrics';
import { sleep } from 'k6';

// Drive 80k sockets across 10k tables and track reconnect success.
// Toxiproxy can inject 5% packet loss and 200ms latency; override WS_URL to point to the proxy when needed.
const ci = !!__ENV.CI;
const defaultSockets = ci ? 100 : 80000;
const defaultTables = ci ? 100 : 10000;
const defaultDuration = ci ? '1m' : '5m';

export const options = {
  vus: Number(__ENV.SOCKETS) || defaultSockets,
  duration: __ENV.DURATION || defaultDuration,
  thresholds: {
    ack_latency: [`p(95)<${__ENV.ACK_P95_MS || 120}`],
  },
};

const tables = Number(__ENV.TABLES) || defaultTables;

const ACK_LATENCY = new Trend('ack_latency', true);
const RECONNECT_SUCCESS = new Rate('reconnect_success');

export default function () {
  const tableId = (__VU - 1) % tables;
  const url = `${__ENV.WS_URL || 'ws://localhost:4000/game'}?table=${tableId}`;

  let attempts = 0;
  let acked = false;

  while (attempts < 2 && !acked) {
    ws.connect(url, function (socket) {
      let start = 0;

      socket.on('open', function () {
        start = Date.now();
        socket.send('action');
      });

      socket.on('message', function () {
        ACK_LATENCY.add(Date.now() - start);
        acked = true;
        socket.close();
      });

      socket.on('error', function (e) {
        console.error('socket error', e);
      });

      socket.setTimeout(function () {
        socket.close();
      }, 1000);
    });

    attempts++;
  }

  if (attempts > 1) {
    RECONNECT_SUCCESS.add(acked);
  }

  sleep(0.1);
}
