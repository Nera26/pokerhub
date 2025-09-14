// Chaos swarm: 80k sockets across 10k tables. Assumes toxiproxy adds 5% packet loss and 200ms jitter.

import { Trend, Rate } from 'k6/metrics';
import { runSocket } from './lib/runSocket.js';

const ACK_LATENCY = new Trend('ack_latency', true);
const ACK_SUCCESS = new Rate('ack_success');

export const options = {
  vus: Number(__ENV.SOCKETS) || 80000,
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
  const tables = Number(__ENV.TABLES) || 10000;
  const tableId = (__VU - 1) % tables;
  const url = __ENV.SIO_URL || 'ws://localhost:4000/game';

  runSocket(url, tableId, ACK_SUCCESS, (socket, action) => {
    const start = Date.now();
    socket.emit('action', action, () => {
      ACK_LATENCY.add(Date.now() - start);
      ACK_SUCCESS.add(1);
    });
  });
}
