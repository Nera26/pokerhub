import http from 'k6/http';
import { sleep } from 'k6';
import { trackGcAndHeap } from './gc-metrics.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function request(path, metric) {
  const res = http.get(`${BASE_URL}${path}`);
  if (metric) {
    metric.add(res.timings.duration);
  }
  sleep(1);
}

export { trackGcAndHeap };
