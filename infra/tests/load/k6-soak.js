import http from 'k6/http';
import { sleep } from 'k6';
import { Gauge, Trend } from 'k6/metrics';

const latency = new Trend('latency');
const gcPause = new Gauge('gc_pause_p95_ms');
const heapGrowth = new Gauge('heap_growth_pct');
const METRICS_FILE = __ENV.GC_METRICS_FILE || '../../metrics/soak_gc.jsonl';

export const options = {
  vus: 50,
  duration: '24h',
  thresholds: {
    latency: ['p(95)<120'],
    gc_pause_p95_ms: ['value<50'],
    heap_growth_pct: ['value<1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const grafanaPushUrl = __ENV.GRAFANA_PUSH_URL;

export default function () {
  const res = http.get(`${BASE_URL}/tables/random`);
  latency.add(res.timings.duration);
  sleep(1);
}

export function teardown() {
  const text = open(METRICS_FILE);
  const lines = text.trim().split('\n');
  const summary = JSON.parse(lines[lines.length - 1] || '{}');
  const gc = Number(summary.gc_p95_ms || 0);
  const heap = Number(summary.heap_delta_pct || 0);
  gcPause.add(gc);
  heapGrowth.add(heap);
  if (gc > 50 || heap > 1) {
    throw new Error(`GC p95 ${gc}ms or heap growth ${heap}% exceeded thresholds`);
  }
}

export function handleSummary(data) {
  if (!grafanaPushUrl) {
    return {};
  }
  const lat = data.metrics.latency?.values || {};
  const heap = data.metrics.heap_growth_pct?.values || {};
  const body = `latency_p95_ms ${lat['p(95)'] || 0}\nheap_growth_pct ${heap.value || 0}\n`;
  http.post(`${grafanaPushUrl}/metrics/job/k6-soak`, body, {
    headers: { 'Content-Type': 'text/plain' },
  });
  return {};
}
