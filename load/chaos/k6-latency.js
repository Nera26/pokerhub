import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: Number(__ENV.VUS) || 20,
  duration: __ENV.DURATION || '1m',
};

export default function () {
  const max = Number(__ENV.MAX_LATENCY_MS) || 1000;
  const delay = Math.random() * max / 1000; // convert ms to s
  sleep(delay); // inject random latency
  const res = http.get(__ENV.TARGET_URL || 'http://localhost:3000/health');
  check(res, { 'status 200': r => r.status === 200 });
}
