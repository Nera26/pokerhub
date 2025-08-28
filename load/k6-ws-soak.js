import ws from 'k6/ws';
import http from 'k6/http';
import { Trend, Gauge } from 'k6/metrics';
import { sleep } from 'k6';

export const options = {
  vus: Number(__ENV.SOCKETS) || 80000,
  duration: __ENV.DURATION || '24h',
  thresholds: {
    memory_leak: ['p(100)<1'], // <1% growth
    gc_pause: ['p(95)<50'], // <50ms p95
  },
};

const tables = Number(__ENV.TABLES) || 10000;
const loss = Number(__ENV.PACKET_LOSS) || 0.05;
const jitterMs = Number(__ENV.JITTER_MS) || 200;
const rngSeed = Number(__ENV.RNG_SEED) || 1;
const metricsUrl = __ENV.METRICS_URL;

const latency = new Trend('ws_latency');
const memoryLeak = new Gauge('memory_leak');
const gcPause = new Trend('gc_pause');

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function setup() {
  if (!metricsUrl) return {};
  const res = http.get(metricsUrl);
  try {
    const data = res.json();
    return { startHeap: data.heapUsed, startGc: data.gcPauseP95 };
  } catch (e) {
    return {};
  }
}

export default function (data) {
  const rng = mulberry32(rngSeed + __VU);
  const tableId = Math.floor(rng() * tables);
  const url = `${__ENV.WS_URL || 'ws://localhost:3000'}?table=${tableId}`;

  ws.connect(url, function (socket) {
    let start = 0;
    socket.on('open', function () {
      sleep((rng() * jitterMs) / 1000);
      start = Date.now();
      if (rng() > loss) {
        socket.send('ping');
      }
    });
    socket.on('message', function () {
      latency.add(Date.now() - start);
      socket.close();
    });
    socket.setTimeout(function () {
      socket.close();
    }, 1000);
  });
}

export function teardown(data) {
  if (!metricsUrl) return;
  const res = http.get(metricsUrl);
  try {
    const end = res.json();
    if (data.startHeap) {
      const growth = ((end.heapUsed - data.startHeap) / data.startHeap) * 100;
      memoryLeak.add(growth);
    }
    if (end.gcPauseP95 !== undefined) {
      gcPause.add(end.gcPauseP95);
    }
  } catch (e) {
    // ignore parsing errors
  }
}
