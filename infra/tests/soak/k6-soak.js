import http from 'k6/http';
import { sleep } from 'k6';
import { Gauge, Trend } from 'k6/metrics';

const gcPause = new Gauge('gc_pause_ms');
const heapUsed = new Gauge('heap_used_mb');
const latency = new Trend('latency');

export const options = {
  vus: Number(__ENV.VUS || 50),
  duration: '24h',
  thresholds: {
    gc_pause_ms: ['p(95)<50'],
    heap_used_mb: ['p(95)<256'],
    latency: ['p(95)<200'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const clickhouseUrl = __ENV.CLICKHOUSE_URL;
const clickhouseTable = __ENV.CLICKHOUSE_TABLE || 'table_action_soak';

export default function () {
  const res = http.post(`${BASE_URL}/tables/action`, JSON.stringify({ action: 'check' }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const gc = parseFloat(res.headers['X-GC-Pause'] || '0');
  if (!isNaN(gc)) {
    gcPause.add(gc);
  }

  const heap = parseFloat(res.headers['X-Heap-Used'] || '0');
  if (!isNaN(heap)) {
    heapUsed.add(heap);
  }

  latency.add(res.timings.duration);
  sleep(1);
}

export function handleSummary(data) {
  if (clickhouseUrl) {
    const metrics = data.metrics;
    const payload = {
      ts: new Date().toISOString(),
      gc_p95: metrics.gc_pause_ms?.['p(95)'] || 0,
      heap_p95: metrics.heap_used_mb?.['p(95)'] || 0,
      lat_p95: metrics.latency?.['p(95)'] || 0,
    };
    http.post(
      `${clickhouseUrl}?query=INSERT INTO ${clickhouseTable} FORMAT JSONEachRow`,
      JSON.stringify(payload),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
  return {};
}
