import http from 'k6/http';
import { sleep } from 'k6';
import { Gauge } from 'k6/metrics';

// Gauge to track memory leak percentage as reported by the service
const memoryLeak = new Gauge('memory_leak_percent');

export const options = {
  vus: 25,
  duration: '10m',
  thresholds: {
    http_req_duration: ['p(95)<120'],
    memory_leak_percent: ['max<1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/rooms`);
  const leakHeader = res.headers['X-Mem-Leak'] || '0';
  const leak = parseFloat(leakHeader);
  if (!isNaN(leak)) {
    memoryLeak.add(leak);
  }
  sleep(1);
}
