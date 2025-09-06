import http from 'k6/http';
import { sleep } from 'k6';
import { Trend, Gauge } from 'k6/metrics';
import { calculateIcmPayouts } from './lib/icm.js';

const ci = !!__ENV.CI;
export const options = {
  vus: Number(__ENV.VUS) || (ci ? 100 : 10000),
  duration: __ENV.DURATION || (ci ? '1m' : '5m'),
  thresholds: {
    tournament_duration: ['p(95)<500'],
    icm_error: ['max<1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

const DURATION = new Trend('tournament_duration', true);
const MEMORY = new Gauge('tournament_memory');
const ICM_ERROR = new Gauge('icm_error');

export default function () {
  const start = Date.now();
  const userId = `user-${__VU}-${__ITER}`;

  const reg = http.post(
    `${BASE_URL}/tournaments/t1/register`,
    JSON.stringify({ userId }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const balance = http.get(`${BASE_URL}/tournaments`);

  const stacks = [
    40000,
    35000,
    30000,
    25000,
    20000,
    15000,
    10000,
    8000,
    6000,
  ];
  const payouts = [
    300000,
    200000,
    150000,
    100000,
    80000,
    70000,
    50000,
    30000,
    20000,
  ];
  const play = http.post(
    `${BASE_URL}/tournaments/t1/prizes`,
    JSON.stringify({
      prizePool: 1000000,
      payouts,
      method: 'icm',
      stacks,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const expected = calculateIcmPayouts(stacks, payouts);
  let resp = [];
  try {
    resp = play.json().prizes || [];
  } catch (e) {
    resp = [];
  }
  const diff = expected.reduce(
    (max, v, i) => Math.max(max, Math.abs(v - (resp[i] || 0))),
    0,
  );
  ICM_ERROR.add(diff);

  DURATION.add(Date.now() - start);

  const memUsage =
    (reg.body ? reg.body.length : 0) +
    (balance.body ? balance.body.length : 0) +
    (play.body ? play.body.length : 0);
  MEMORY.add(memUsage);

  sleep(1);
}
