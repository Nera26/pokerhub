import http from 'k6/http';
import { Trend } from 'k6/metrics';
import swarm, { options as swarmOptions } from './k6-swarm.js';

export const options = {
  ...swarmOptions,
  duration: '24h',
  thresholds: {
    ...(swarmOptions.thresholds || {}),
    rss_growth: ['p(100)<1'],
    gc_pause: ['p(95)<50'],
  },
};

const RSS_GROWTH = new Trend('rss_growth');
const GC_PAUSE = new Trend('gc_pause');

export default swarm;
export { handleSummary } from './k6-swarm.js';

export function setup() {
  const url = __ENV.METRICS_URL;
  if (!url) return {};
  try {
    const res = http.get(url);
    const data = res.json();
    if (data.rssBytes !== undefined) {
      return { startRss: data.rssBytes };
    }
  } catch (e) {
    // ignore parse errors
  }
  return {};
}

export function teardown(data) {
  const url = __ENV.METRICS_URL;
  if (!url) return;
  let end;
  try {
    const res = http.get(url);
    end = res.json();
  } catch (e) {
    // ignore network/parse errors
    return;
  }
  if (end.rssDeltaPct !== undefined) {
    RSS_GROWTH.add(end.rssDeltaPct);
    if (end.rssDeltaPct >= 1) {
      throw new Error(`RSS growth ${end.rssDeltaPct.toFixed(2)}% exceeds 1%`);
    }
  } else if (data.startRss && end.rssBytes !== undefined) {
    const growth = ((end.rssBytes - data.startRss) / data.startRss) * 100;
    RSS_GROWTH.add(growth);
    if (growth >= 1) {
      throw new Error(`RSS growth ${growth.toFixed(2)}% exceeds 1%`);
    }
  }
  if (end.gcPauseP95 !== undefined) {
    GC_PAUSE.add(end.gcPauseP95);
    if (end.gcPauseP95 >= 50) {
      throw new Error(`gc pause p95 ${end.gcPauseP95}ms exceeds 50ms`);
    }
  }
}
