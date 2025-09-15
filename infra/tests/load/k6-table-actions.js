import ws from 'k6/ws';
import http from 'k6/http';
import { Trend, Counter } from 'k6/metrics';
import { trackGcAndHeap } from './gc-metrics.js';
import { sleep } from 'k6';

const CHAOS_MODE = __ENV.CHAOS_MODE === '1' || __ENV.CHAOS_MODE === 'true';

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


const ACK_LATENCY = new Trend('ack_latency', true);
const DROPPED_FRAMES = new Counter('dropped_frames');
const RATE_LIMIT_ERRORS = new Counter('rate_limit_errors');
const ACTION_COUNTER = new Counter('table_actions');

export const options = {
  vus: Number(__ENV.SOCKETS || (CHAOS_MODE ? 100000 : 80000)),
  duration: __ENV.DURATION || '5m',
  thresholds: {
    ack_latency: CHAOS_MODE
      ? [`p(95)<${__ENV.ACK_P95_MS || 120}`]
      : [
          `p(50)<${__ENV.ACK_P50_MS || 40}`,
          `p(95)<${__ENV.ACK_P95_MS || 120}`,
          `p(99)<${__ENV.ACK_P99_MS || 200}`,
        ],
    table_actions: ['rate>2.5'],
    gc_pause_p95_ms: ['value<50'],
    heap_growth_pct: ['value<1'],
  },
};

export default function () {
  const tables = Number(__ENV.TABLES || 10000);
  const actionsPerMin = Number(__ENV.ACTIONS_PER_MIN || 6000);
  const url = __ENV.WS_URL || 'ws://localhost:3001';
  const loss = Number(__ENV.PACKET_LOSS || 0.05);
  const jitterMs = Number(__ENV.JITTER_MS || 200);
  const ackTimeout = Number(__ENV.ACK_TIMEOUT_MS || 1000);
  const seed = Number(__ENV.SEED || Date.now());
  const rng = CHAOS_MODE ? mulberry32(seed + __VU) : Math.random;

  ws.connect(`${url}?table=${__VU % tables}`, function (socket) {
    const intervalMs = 60000 / actionsPerMin;

    socket.on('open', function () {
      socket.setInterval(function () {
        let acked = false;
        const start = Date.now();
        const handler = (msg) => {
          acked = true;
          if (String(msg).includes('rate limit exceeded')) {
            RATE_LIMIT_ERRORS.add(1);
          } else {
            ACK_LATENCY.add(Date.now() - start);
            ACTION_COUNTER.add(1);
          }
          socket.off('message', handler);
        };
        socket.on('message', handler);
        sleep(rng() * jitterMs / 1000);
        if (rng() > loss) {
          socket.send('action');
        }
        socket.setTimeout(function () {
          if (!acked) {
            DROPPED_FRAMES.add(1);
            socket.off('message', handler);
          }
        }, ackTimeout);
      }, intervalMs);
    });

    socket.setTimeout(function () {
      socket.close();
    }, Number(__ENV.SOCKET_TTL_MS || 60000));
  });
}

export function handleSummary(data) {
  const url = __ENV.CLICKHOUSE_URL;
  if (url) {
    const table = __ENV.CLICKHOUSE_TABLE || 'ws_ack_latency';
    const payload = {
      ts: new Date().toISOString(),
      p50: data.metrics.ack_latency['p(50)'],
      p95: data.metrics.ack_latency['p(95)'],
      p99: data.metrics.ack_latency['p(99)'],
      dropped_frames: data.metrics.dropped_frames?.count || 0,
    };
    http.post(
      `${url}?query=INSERT INTO ${table} FORMAT JSONEachRow`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
  const result = {};
  if (CHAOS_MODE && __ENV.MEM_URL) {
    const mem = http.get(__ENV.MEM_URL).body;
    result['memory.json'] = mem;
  }
  return result;
}

export function teardown() {
  trackGcAndHeap();
}
