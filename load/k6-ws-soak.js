import ws from 'k6/ws';
import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { sleep } from 'k6';

const cpuThreshold = Number(__ENV.CPU_THRESHOLD) || 80;
const grafanaPushUrl = __ENV.GRAFANA_PUSH_URL;

export const options = {
  vus: Number(__ENV.SOCKETS) || 80000,
  duration: '24h',
  thresholds: {
    ws_latency: ['p(95)<120'], // <120ms p95
    rss_growth: ['p(100)<1'], // <1% RSS growth
    gc_pause: ['p(95)<50'], // <50ms p95
    cpu_usage: [`p(100)<${cpuThreshold}`],
  },
};

const tables = Number(__ENV.TABLES) || 10000;
const loss = Number(__ENV.PACKET_LOSS) || 0.05;
const jitterMs = Number(__ENV.JITTER_MS) || 200;
const rngSeed = Number(__ENV.RNG_SEED) || 1;
const metricsUrl = __ENV.METRICS_URL;

const latency = new Trend('ws_latency');
const rssGrowth = new Trend('rss_growth');
const gcPause = new Trend('gc_pause');
const cpuUsage = new Trend('cpu_usage');

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
    return {
      startRss: data.rssBytes,
      startGc: data.gcPauseP95,
    };
  } catch (e) {
    return {};
  }
}

export default function (data) {
  const rng = mulberry32(rngSeed + __VU);
  const tableId = Math.floor(rng() * tables);
  const url = `${__ENV.WS_URL || 'ws://localhost:4000/game'}?table=${tableId}`;

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
    if (data.startRss && end.rssBytes !== undefined) {
      const growth = ((end.rssBytes - data.startRss) / data.startRss) * 100;
      rssGrowth.add(growth);
    }
    if (end.gcPauseP95 !== undefined) {
      gcPause.add(end.gcPauseP95);
    }
    if (end.cpuPercent !== undefined) {
      cpuUsage.add(end.cpuPercent);
    }
  } catch (e) {
    // ignore parsing errors
  }
}

export function handleSummary(data) {
  const latHist = data.metrics.ws_latency?.histogram || data.metrics.ws_latency?.bins || {};
  const cpuHist = data.metrics.cpu_usage?.histogram || data.metrics.cpu_usage?.bins || {};
  const heapHist = data.metrics.rss_growth?.histogram || data.metrics.rss_growth?.bins || {};
  const gcHist = data.metrics.gc_pause?.histogram || data.metrics.gc_pause?.bins || {};
  if (grafanaPushUrl) {
    const latencyMetrics = data.metrics.ws_latency?.values || {};
    const p50 = latencyMetrics['p(50)'] || 0;
    const p95 = latencyMetrics['p(95)'] || 0;
    const p99 = latencyMetrics['p(99)'] || 0;
    const body = `ws_latency_p50_ms ${p50}\nws_latency_p95_ms ${p95}\nws_latency_p99_ms ${p99}\n`;
    http.post(`${grafanaPushUrl}/metrics/job/ws-soak`, body, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return {
    'metrics/latency-histogram.json': JSON.stringify(latHist, null, 2),
    'metrics/cpu-histogram.json': JSON.stringify(cpuHist, null, 2),
    'metrics/heap-histogram.json': JSON.stringify(heapHist, null, 2),
    'metrics/gc-histogram.json': JSON.stringify(gcHist, null, 2),
  };
}
