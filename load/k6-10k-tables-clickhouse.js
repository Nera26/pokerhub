import ws from 'k6/ws';
import { Trend, Rate } from 'k6/metrics';
import { sleep } from 'k6';

export const options = {
  vus: Number(__ENV.SOCKETS) || 80000,
  duration: __ENV.DURATION || '5m',
  thresholds: {
    ws_ack_latency: [`p(95)<${__ENV.ACK_P95_MS || 200}`],
    ws_errors: ['rate<0.01'],
  },
};

const tables = Number(__ENV.TABLES) || 10000;
const loss = Number(__ENV.PACKET_LOSS) || 0.05; // 5% packet loss
const jitterMs = Number(__ENV.JITTER_MS) || 200; // 200ms jitter

const ACK_LATENCY = new Trend('ws_ack_latency', true);
const ERR_RATE = new Rate('ws_errors');

export default function () {
  const tableId = __VU % tables;
  const url = `${__ENV.WS_URL || 'ws://localhost:3001'}?table=${tableId}`;

  ws.connect(url, function (socket) {
    let start = 0;
    let acked = false;

    socket.on('open', function () {
      // client-side jitter before sending
      sleep(Math.random() * jitterMs / 1000);
      start = Date.now();
      if (Math.random() > loss) {
        socket.send('action');
      }
    });

    socket.on('message', function () {
      acked = true;
      ACK_LATENCY.add(Date.now() - start);
      socket.close();
    });

    socket.on('error', function () {
      ERR_RATE.add(1);
    });

    socket.setTimeout(function () {
      if (!acked) {
        ERR_RATE.add(1);
      }
      socket.close();
    }, 1000);
  });
}
