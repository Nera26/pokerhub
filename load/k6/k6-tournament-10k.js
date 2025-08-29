import http from 'k6/http';
import { Trend } from 'k6/metrics';
import { check, fail } from 'k6';

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

function calculateIcmPayouts(stacks, prizes) {
  const raw = icmRecursive(stacks, prizes);
  const floored = raw.map(Math.floor);
  const remainder = prizes.reduce((a, b) => a + b, 0) - floored.reduce((a, b) => a + b, 0);
  const fractions = raw.map((v, i) => ({ i, frac: v - floored[i] }));
  fractions.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder; i++) {
    floored[fractions[i].i] += 1;
  }
  return floored;
}

function icmRecursive(stacks, prizes) {
  const n = stacks.length;
  if (prizes.length === 0) return new Array(n).fill(0);
  const total = stacks.reduce((a, b) => a + b, 0);
  const res = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const prob = stacks[i] / total;
    res[i] += prizes[0] * prob;
    if (prizes.length > 1) {
      const remainingStacks = stacks.filter((_, idx) => idx !== i);
      const sub = icmRecursive(remainingStacks, prizes.slice(1));
      for (let j = 0; j < sub.length; j++) {
        const idx = j >= i ? j + 1 : j;
        res[idx] += sub[j] * prob;
      }
    }
  }
  return res;
}

