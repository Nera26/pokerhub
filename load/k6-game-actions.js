import ws from 'k6/ws';
import { Trend, Rate } from 'k6/metrics';

const ACK_LATENCY = new Trend('ack_latency', true);
const ACK_SUCCESS = new Rate('ack_success');

export const options = {
  vus: Number(__ENV.SOCKETS) || 11000,
  duration: __ENV.DURATION || '1m',
  thresholds: {
    ack_latency: [
      `p(95)<${__ENV.ACK_P95_MS || 200}`,
      `p(99)<${__ENV.ACK_P99_MS || 400}`,
    ],
    ack_success: [`rate>${__ENV.ACK_SUCCESS_RATE || 0.99}`],
  },
};

export default function () {
  const url = __ENV.WS_URL || 'ws://localhost:4000/game';

  ws.connect(url, function (socket) {
    let start = 0;

    socket.on('open', function () {
      start = Date.now();
      socket.send('action');
    });

    socket.on('message', function () {
      ACK_LATENCY.add(Date.now() - start);
      ACK_SUCCESS.add(1);
      socket.close();
    });

    socket.on('error', function () {
      ACK_SUCCESS.add(0);
    });

    socket.setTimeout(function () {
      // treat missing ACK as drop
      ACK_SUCCESS.add(0);
      socket.close();
    }, Number(__ENV.ACK_TIMEOUT_MS) || 1000);
  });
}
