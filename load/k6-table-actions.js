import ws from 'k6/ws';
import { Trend } from 'k6/metrics';

const ACK_LATENCY = new Trend('ack_latency', true);

export const options = {
  vus: Number(__ENV.SOCKETS || 50),
  duration: __ENV.DURATION || '1m',
  thresholds: {
    ack_latency: [`p(95)<${__ENV.ACK_P95_MS || 500}`],
  },
};

export default function () {
  const tables = Number(__ENV.TABLES || 10);
  const actionsPerMin = Number(__ENV.ACTIONS_PER_MIN || 180);
  const url = __ENV.WS_URL || 'ws://localhost:3001';

  ws.connect(`${url}?table=${__VU % tables}`, function (socket) {
    const intervalMs = 60000 / actionsPerMin;

    socket.on('open', function () {
      socket.setInterval(function () {
        const start = Date.now();
        const handler = () => {
          ACK_LATENCY.add(Date.now() - start);
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
