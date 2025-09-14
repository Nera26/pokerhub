import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { request, trackGcAndHeap } from './k6-common.js';

const latency = new Trend('latency');
const grafanaPushUrl = __ENV.GRAFANA_PUSH_URL;

export const options = {
  vus: 50,
  duration: '24h',
  thresholds: {
    latency: ['p(95)<120'],
    gc_pause_p95_ms: ['value<50'],
    heap_growth_pct: ['value<1'],
  },
};

export default function () {
  request('/tables/random', latency);
}

export function teardown() {
  trackGcAndHeap();
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
