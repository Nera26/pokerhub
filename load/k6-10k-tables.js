import ws from 'k6/ws';
import { Trend } from 'k6/metrics';
import { sleep } from 'k6';

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
  },
};

const tables = Number(__ENV.TABLES) || defaultTables;
const loss = Number(__ENV.PACKET_LOSS) || 0.05; // 5% packet loss
const jitterMs = Number(__ENV.JITTER_MS) || 50; // jitter before sending

const ACK_LATENCY = new Trend('ack_latency', true);

export default function () {
  const tableId = __VU % tables;
  const url = `${__ENV.WS_URL || 'ws://localhost:3001'}?table=${tableId}`;

  ws.connect(url, function (socket) {
    let start = 0;

    socket.on('open', function () {
      // inject client side jitter
      sleep(Math.random() * jitterMs / 1000);
      start = Date.now();
      if (Math.random() > loss) {
        socket.send('action');
      }
    });

    socket.on('message', function () {
      ACK_LATENCY.add(Date.now() - start);
      socket.close();
    });

    socket.on('error', function (e) {
      console.error('socket error', e);
    });

    socket.setTimeout(function () {
      // close if no ack
      socket.close();
    }, 1000);
  });
}
