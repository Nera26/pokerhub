import ws from 'k6/ws';
import http from 'k6/http';
import { Trend, Rate } from 'k6/metrics';
import { sleep, check, fail } from 'k6';
import { SharedArray } from 'k6/data';
import { Random } from 'https://jslib.k6.io/random/1.0.0/index.js';
import { calculateIcmPayouts } from '../lib/icm.js';
import { setup as baseSetup, teardown as baseTeardown } from './utils.js';

// Drive socket and tournament scenarios with shared setup/teardown.
const ci = !!__ENV.CI;
const defaultSockets = ci ? 100 : 80000;
const defaultTables = ci ? 100 : 10000;
const defaultDuration = ci ? '1m' : '5m';

const tables = Number(__ENV.TABLES) || defaultTables;
const tournaments = Number(__ENV.TOURNAMENTS) || 0;
const sockets = Number(__ENV.SOCKETS) || defaultSockets;
const duration = __ENV.DURATION || defaultDuration;

// Tournament parameters
const BASE_URL = __ENV.BASE_URL || 'https://staging.pokerhub';
const EXPECTED_DURATION = Number(__ENV.EXPECTED_DURATION || 60000);
const PRIZE_POOL = Number(__ENV.PRIZE_POOL || 1000000);
function loadTournamentParams() {
  if (__ENV.PAYOUTS && __ENV.STACKS) {
    return {
      payouts: __ENV.PAYOUTS.split(',').map(Number),
      stacks: __ENV.STACKS.split(',').map(Number),
    };
  }

  try {
    const res = http.post(
      `${BASE_URL}/tournaments/t1/prizes`,
      JSON.stringify({ prizePool: PRIZE_POOL }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    const body = res.json();
    const payouts = body?.payouts;
    const stacks = body?.stacks;
    if (!Array.isArray(payouts) || !Array.isArray(stacks)) {
      throw new Error('missing payouts or stacks');
    }
    return { payouts: payouts.map(Number), stacks: stacks.map(Number) };
  } catch (e) {
    fail(`Failed to load tournament params: ${e.message}`);
  }
}

const { payouts: PAYOUTS, stacks: STACKS } = loadTournamentParams();
console.log(`Loaded payouts: ${PAYOUTS.join(',')} stacks: ${STACKS.join(',')}`);

export const options = {
  scenarios: {
    tables: {
      executor: 'constant-vus',
      exec: 'tableScenario',
      vus: sockets,
      duration,
      startTime: '0s',
    },
    tournaments: {
      executor: 'per-vu-iterations',
      exec: 'tournamentScenario',
      vus: tournaments,
      iterations: tournaments,
      startTime: '0s',
    },
  },
  thresholds: {
    ack_latency: [
      `p(95)<${__ENV.ACK_P95_MS || 120}`,
      `p(99)<${__ENV.ACK_P99_MS || 200}`,
    ],
    error_rate: [`rate<${__ENV.ERROR_RATE_MAX || 0.01}`],
    tournament_runtime: ['p(95)<5000'],
  },
};

const seed = Number(__ENV.RNG_SEED) || 1;
const grafanaPushUrl = __ENV.GRAFANA_PUSH_URL;
const metricsUrl = __ENV.METRICS_URL;
const loss = Number(__ENV.PACKET_LOSS) || 0;
const jitterMs = Number(__ENV.JITTER_MS) || 0;
const replayFile = __ENV.REPLAY_FILE;

const handHistories = replayFile
  ? new SharedArray('hands', () => {
      try {
        return JSON.parse(open(replayFile));
      } catch {
        return [[]];
      }
    })
  : null;

const ACK_LATENCY = new Trend('ack_latency', true);
const ERROR_RATE = new Rate('error_rate');
const HEAP_USED = new Trend('heap_used');
const GC_PAUSE = new Trend('gc_pause_ms', true);
const RUNTIME = new Trend('tournament_runtime', true);

export function setup() {
  if (sockets > 0) {
    try {
      const data = baseSetup();
      return { ...data };
    } catch (e) {
      console.error('socket proxy setup failed', e.message);
    }
  }
  return { start: Date.now() };
}

export function teardown(data) {
  baseTeardown(data);
  if (tournaments > 0) {
    const elapsed = data.elapsed || 0;
    RUNTIME.add(elapsed);
    const diff = Math.abs(elapsed - EXPECTED_DURATION) / EXPECTED_DURATION;
    if (diff > 0.05) {
      console.error(`Runtime ${elapsed}ms deviates >5% from expected ${EXPECTED_DURATION}ms`);
    }
    const res = http.post(
      `${BASE_URL}/tournaments/t1/prizes`,
      JSON.stringify({ prizePool: PRIZE_POOL, payouts: PAYOUTS, stacks: STACKS }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    const actual = res.json('prizes') || [];
    const expected = calculateIcmPayouts(STACKS, PAYOUTS);
    let mismatch = false;
    for (let i = 0; i < expected.length; i++) {
      if (Math.abs((actual[i] || 0) - expected[i]) > 1) {
        mismatch = true;
        console.error(`Prize mismatch at position ${i + 1}: expected ${expected[i]}, got ${actual[i]}`);
      }
    }
    if (diff > 0.05 || mismatch) {
      fail('Tournament validation failed');
    }
  }
}

export function tableScenario(data) {
  const rng = new Random(seed + __VU);
  const tableId = Math.floor(rng.nextFloat() * tables);
  const url = `${data.wsUrl}?table=${tableId}`;
  const history = handHistories ? handHistories[tableId % handHistories.length] : null;

  ws.connect(url, function (socket) {
    let start = 0;
    let idx = 0;
    let acked = false;

    socket.on('open', function () {
      if (history) {
        if (jitterMs > 0) sleep((rng.nextFloat() * jitterMs) / 1000);
        start = Date.now();
        sendNext();
      } else {
        start = Date.now();
        socket.send('action');
      }
    });

    function sendNext() {
      if (!history || idx >= history.length) {
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
        acked = true;
        ACK_LATENCY.add(Date.now() - start);
        ERROR_RATE.add(0);
      }
      if (history) {
        sendNext();
      } else {
        socket.close();
      }
    });

    socket.on('error', function (e) {
      if (!acked) {
        ERROR_RATE.add(1);
        acked = true;
      }
      console.error('socket error', e);
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

  if (metricsUrl) {
    try {
      const res = http.get(metricsUrl);
      const body = res.body;
      const heapMatch = body.match(/nodejs_heap_size_used_bytes\s+(\d+)/);
      const gcSum = body.match(/nodejs_gc_duration_seconds_sum\s+([0-9.]+)/);
      const gcCount = body.match(/nodejs_gc_duration_seconds_count\s+([0-9.]+)/);
      if (heapMatch) {
        HEAP_USED.add(Number(heapMatch[1]));
      }
      if (gcSum && gcCount && Number(gcCount[1]) > 0) {
        GC_PAUSE.add((Number(gcSum[1]) / Number(gcCount[1])) * 1000);
      }
    } catch {
      // ignore metrics errors
    }
  }
}

export function tournamentScenario() {
  const userId = `user-${__VU}-${__ITER}`;
  const res = http.post(
    `${BASE_URL}/tournaments/t1/register`,
    JSON.stringify({ userId }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { registered: (r) => r.status === 200 });
}

export function handleSummary(data) {
  const ackHist = data.metrics.ack_latency?.histogram || data.metrics.ack_latency?.bins || {};
  const heapHist = data.metrics.heap_used?.histogram || data.metrics.heap_used?.bins || {};
  const gcHist = data.metrics.gc_pause_ms?.histogram || data.metrics.gc_pause_ms?.bins || {};
  const p95 = data.metrics.ack_latency?.values?.['p(95)'] || 0;
  const drop = data.metrics.error_rate?.rate || 0;
  const heapP95 = data.metrics.heap_used?.values?.['p(95)'] || 0;
  const gcP95 = data.metrics.gc_pause_ms?.values?.['p(95)'] || 0;
  if (grafanaPushUrl) {
    const body = `ack_latency_p95_ms ${p95}\nerror_rate ${drop}\nheap_used_p95 ${heapP95}\ngc_pause_p95_ms ${gcP95}\n`;
    http.post(`${grafanaPushUrl}/metrics/job/k6-10k-tables`, body, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  const vus = data.options?.scenarios?.tables?.vus || 0;
  const vuSeeds = [];
  for (let i = 1; i <= vus; i++) {
    vuSeeds.push(seed + i);
  }
  return {
    'metrics/ack-histogram.json': JSON.stringify(ackHist, null, 2),
    'metrics/heap-histogram.json': JSON.stringify(heapHist, null, 2),
    'metrics/gc-histogram.json': JSON.stringify(gcHist, null, 2),
    'metrics/seeds.json': JSON.stringify({ runSeed: seed, vuSeeds }, null, 2),
  };
}
