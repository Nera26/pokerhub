import http from 'k6/http';
import { sleep } from 'k6';
import { Trend, Gauge } from 'k6/metrics';

function calculateIcmPayouts(stacks, prizes) {
  function icmRecursive(st, pr) {
    const n = st.length;
    if (pr.length === 0) return new Array(n).fill(0);
    const total = st.reduce((a, b) => a + b, 0);
    const res = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const prob = st[i] / total;
      res[i] += pr[0] * prob;
      if (pr.length > 1) {
        const remaining = st.filter((_, idx) => idx !== i);
        const sub = icmRecursive(remaining, pr.slice(1));
        for (let j = 0; j < sub.length; j++) {
          const idx = j >= i ? j + 1 : j;
          res[idx] += sub[j] * prob;
        }
      }
    }
    return res;
  }

  const raw = icmRecursive(stacks, prizes);
  const floored = raw.map(Math.floor);
  const remainder =
    prizes.reduce((a, b) => a + b, 0) -
    floored.reduce((a, b) => a + b, 0);
  const fractions = raw.map((v, i) => ({ i, frac: v - floored[i] }));
  fractions.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder; i++) {
    floored[fractions[i].i] += 1;
  }
  return floored;
}

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
