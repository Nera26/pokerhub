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

export function teardown() {
  const url = __ENV.METRICS_URL;
  if (!url) return;
  try {
    const res = http.get(url);
    const data = res.json();
    if (data.heapUsed !== undefined) {
      HEAP_USED.add(data.heapUsed);
    }
    if (data.gcPauseP95 !== undefined) {
      GC_PAUSE.add(data.gcPauseP95);
    }
  } catch (e) {
    // ignore parse errors
  }
}
