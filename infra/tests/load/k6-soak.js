import http from 'k6/http';
import { sleep } from 'k6';
import { Gauge, Trend } from 'k6/metrics';

const gcPause = new Gauge('gc_pause_ms');
const latency = new Trend('latency');
const memLeak = new Gauge('mem_leak');

export const options = {
  vus: 50,
  duration: '24h',
  thresholds: {
    gc_pause_ms: ['p(95)<50'],
    latency: ['p(95)<120'],
    mem_leak: ['p(100)<1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const grafanaPushUrl = __ENV.GRAFANA_PUSH_URL;

export default function () {
  const res = http.get(`${BASE_URL}/tables/random`);
  const gc = parseFloat(res.headers['X-GC-Pause'] || '0');
  if (!isNaN(gc)) {
    gcPause.add(gc);
  }
  const leak = parseFloat(res.headers['X-Mem-Leak'] || '0');
  if (!isNaN(leak)) {
    memLeak.add(leak);
  }
  latency.add(res.timings.duration);
  sleep(1);
}

export function handleSummary(data) {
  if (!grafanaPushUrl) {
    return {};
  }
  const lat = data.metrics.latency?.values || {};
  const leak = data.metrics.mem_leak?.values || {};
  const body = `latency_p95_ms ${lat['p(95)'] || 0}\nmem_leak_pct ${leak['p(100)'] || 0}\n`;
  http.post(`${grafanaPushUrl}/metrics/job/k6-soak`, body, {
    headers: { 'Content-Type': 'text/plain' },
  });
  return {};
}
