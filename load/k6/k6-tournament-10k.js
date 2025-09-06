import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { check, fail } from 'k6';
import { calculateIcmPayouts } from '../lib/icm.js';

const ci = !!__ENV.CI;

export const options = {
  vus: Number(__ENV.VUS) || (ci ? 100 : 10000),
  iterations: Number(__ENV.ITERATIONS) || (ci ? 100 : 10000),
  thresholds: {
    tournament_runtime: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.pokerhub';
const EXPECTED_DURATION = Number(__ENV.EXPECTED_DURATION || 60000);
const PRIZE_POOL = Number(__ENV.PRIZE_POOL || 1000000);
const PAYOUTS = (__ENV.PAYOUTS ? __ENV.PAYOUTS.split(',').map(Number) : [300000,200000,150000,100000,80000,70000,50000,30000,20000]);
const STACKS = (__ENV.STACKS ? __ENV.STACKS.split(',').map(Number) : Array.from({ length: PAYOUTS.length }, (_, i) => PAYOUTS.length - i));

const RUNTIME = new Trend('tournament_runtime', true);

export function setup() {
  return { start: Date.now() };
}

export default function () {
  const userId = `user-${__VU}-${__ITER}`;
  const res = http.post(`${BASE_URL}/tournaments/t1/register`, JSON.stringify({ userId }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { registered: (r) => r.status === 200 });
}

export function teardown(data) {
  const elapsed = Date.now() - data.start;
  RUNTIME.add(elapsed);
  const diff = Math.abs(elapsed - EXPECTED_DURATION) / EXPECTED_DURATION;
  if (diff > 0.05) {
    console.error(`Runtime ${elapsed}ms deviates >5% from expected ${EXPECTED_DURATION}ms`);
  }

  const res = http.post(
    `${BASE_URL}/tournaments/t1/prizes`,
    JSON.stringify({ prizePool: PRIZE_POOL, payouts: PAYOUTS, stacks: STACKS }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const actual = res.json('prizes') || [];
  const expected = calculateIcmPayouts(STACKS, PAYOUTS);

  let mismatch = false;
  for (let i = 0; i < expected.length; i++) {
    if (Math.abs((actual[i] || 0) - expected[i]) > 1) {
      mismatch = true;
      console.error(`Prize mismatch at position ${i + 1}: expected ${expected[i]}, got ${actual[i]}`);
    }
  }

  if (diff > 0.05 || mismatch) {
    fail('Tournament validation failed');
  }
}

