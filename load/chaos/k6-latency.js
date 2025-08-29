import http from 'k6/http';
import { sleep, check } from 'k6';
import { Gauge, Trend } from 'k6/metrics';

export const options = {
  vus: Number(__ENV.VUS) || 20,
  duration: '24h',
  thresholds: {
    rss_growth: ['p(100)<1'],
    gc_pause: ['p(95)<50'],
  },
};

const metricsUrl = __ENV.METRICS_URL;
const rssGrowth = new Gauge('rss_growth');
const gcPause = new Trend('gc_pause');

export function setup() {
  if (!metricsUrl) return {};
  const res = http.get(metricsUrl);
  try {
    const data = res.json();
    return {
      startRss: data.rssBytes,
      startGc: data.gcPauseP95,
    };
  } catch (e) {
    return {};
  }
}

export default function () {
  const max = Number(__ENV.MAX_LATENCY_MS) || 1000;
  const delay = Math.random() * max / 1000; // convert ms to s
  sleep(delay); // inject random latency
  const res = http.get(__ENV.TARGET_URL || 'http://localhost:3000/health');
  check(res, { 'status 200': r => r.status === 200 });
}

export function teardown(data) {
  if (!metricsUrl) return;
  const res = http.get(metricsUrl);
  try {
    const end = res.json();
    if (data.startRss && end.rssBytes !== undefined) {
      const growth = ((end.rssBytes - data.startRss) / data.startRss) * 100;
      rssGrowth.add(growth);
    }
    if (end.gcPauseP95 !== undefined) {
      gcPause.add(end.gcPauseP95);
    }
  } catch (e) {
    // ignore parsing errors
  }
}
