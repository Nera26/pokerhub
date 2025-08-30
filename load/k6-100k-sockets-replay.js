import ws from 'k6/ws';
import { Trend, Rate } from 'k6/metrics';
import { sleep } from 'k6';
import { Random } from 'https://jslib.k6.io/random/1.0.0/index.js';
import { SharedArray } from 'k6/data';

const handHistories = new SharedArray('hands', () => {
  const path = __ENV.HAND_HISTORY_FILE || 'load/test/hand-history.json';
  try {
    return JSON.parse(open(path));
  } catch (e) {
    return [[]];
  }
});

export const options = {
  vus: Number(__ENV.SOCKETS) || 100000,
  duration: __ENV.DURATION || '5m',
  thresholds: {
    ack_latency: [`p(95)<${__ENV.ACK_P95_MS || 120}`, `p(99)<${__ENV.ACK_P99_MS || 200}`],
    error_rate: [`rate<${__ENV.ERROR_RATE_MAX || 0.01}`],
  },
};

const tables = Number(__ENV.TABLES) || 10000;
const loss = Number(__ENV.PACKET_LOSS) || 0.05;
const jitterMs = Number(__ENV.JITTER_MS) || 200;
const seed = Number(__ENV.RNG_SEED) || 1;

const ACK_LATENCY = new Trend('ack_latency', true);
const ERROR_RATE = new Rate('error_rate');

export default function () {
  const rng = new Random(seed + __VU);
  const tableId = __VU % tables;
  const history = handHistories[tableId % handHistories.length];
  const url = `${__ENV.WS_URL || 'ws://localhost:4000/game'}?table=${tableId}`;

  ws.connect(url, function (socket) {
    let start = 0;
    let idx = 0;
    let acked = false;

    socket.on('open', function () {
      sleep(rng.nextFloat() * jitterMs / 1000);
      start = Date.now();
      sendNext();
    });

    function sendNext() {
      if (idx >= history.length) {
        socket.close();
        return;
      }
      const msg = history[idx++];
      if (rng.nextFloat() > loss) {
        socket.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    }

    socket.on('message', function () {
      if (!acked) {
        ACK_LATENCY.add(Date.now() - start);
        acked = true;
      }
      sendNext();
    });

    socket.on('error', function () {
      if (!acked) {
        ERROR_RATE.add(1);
        acked = true;
      }
      socket.close();
    });

    socket.setTimeout(function () {
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
  return { 'metrics/ack-histogram.json': JSON.stringify(hist, null, 2) };
}
