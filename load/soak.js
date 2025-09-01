import http from 'k6/http';
import { Gauge, Trend } from 'k6/metrics';
import swarm, { options as swarmOptions } from './k6-swarm.js';

export const options = {
  ...swarmOptions,
  duration: '24h',
};

const HEAP_USED = new Gauge('heap_used_bytes');
const GC_PAUSE = new Trend('gc_pause_ms');

export default swarm;

export function setup() {
  const url = __ENV.METRICS_URL;
  if (!url) return {};
  try {
    const res = http.get(url);
    const data = res.json();
    if (data.heapUsed !== undefined) {
      return { startHeap: data.heapUsed };
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
  if (end.heapUsed !== undefined) {
    HEAP_USED.add(end.heapUsed);
    if (data.startHeap) {
      const growth = ((end.heapUsed - data.startHeap) / data.startHeap) * 100;
      if (growth >= 1) {
        throw new Error(`heap usage grew by ${growth.toFixed(2)}%`);
      }
    }
  }
  if (end.gcPauseP95 !== undefined) {
    GC_PAUSE.add(end.gcPauseP95);
    if (end.gcPauseP95 >= 50) {
      throw new Error(`gc pause p95 ${end.gcPauseP95}ms exceeds 50ms`);
    }
  }
}
