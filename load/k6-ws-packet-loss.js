import ws from 'k6/ws';
import { Trend } from 'k6/metrics';

export const options = {
  vus: Number(__ENV.VUS) || 10000,
  duration: __ENV.DURATION || '1m',
  thresholds: {
    ws_latency: ['p(95)<120'],
  },
};

const latency = new Trend('ws_latency', true);

export default function () {
  const url = __ENV.WS_URL || 'ws://localhost:4000/game';
  const loss = Number(__ENV.PACKET_LOSS) || 0.05; // 5% packet loss by default

  ws.connect(url, function (socket) {
    let start = 0;

    socket.on('open', function () {
      start = Date.now();
      if (Math.random() > loss) {
        socket.send('ping');
      }
    });

    socket.on('message', function () {
      latency.add(Date.now() - start);
      socket.close();
    });

    socket.on('error', function (e) {
      console.error('socket error', e);
    });

    socket.setTimeout(function () {
      socket.close();
    }, 1000);
  });
}
