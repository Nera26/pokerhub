import http from 'k6/http';
import { sleep } from 'k6';
import { Gauge } from 'k6/metrics';

const gcPause = new Gauge('gc_pause_ms');

export const options = {
  vus: 50,
  duration: '24h',
  thresholds: {
    gc_pause_ms: ['p(95)<50'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/tables/random`);
  const gc = parseFloat(res.headers['X-GC-Pause'] || '0');
  if (!isNaN(gc)) {
    gcPause.add(gc);
  }
  sleep(1);
}
