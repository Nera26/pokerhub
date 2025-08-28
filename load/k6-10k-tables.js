import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { sleep } from 'k6';

export const options = {
  vus: 10000,
  duration: '5m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    table_req_latency: ['p(95)<300'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const tableLatency = new Trend('table_req_latency', true);

export default function () {
  const start = Date.now();
  http.get(`${BASE_URL}/tables/random`);
  tableLatency.add(Date.now() - start);
  sleep(1);
}
