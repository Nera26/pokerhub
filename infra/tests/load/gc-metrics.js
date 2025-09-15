import { Gauge } from 'k6/metrics';

const gcPause = new Gauge('gc_pause_p95_ms');
const heapGrowth = new Gauge('heap_growth_pct');
const METRICS_FILE = __ENV.GC_METRICS_FILE || '../../metrics/soak_gc.jsonl';

export function trackGcAndHeap() {
  const text = open(METRICS_FILE);
  const lines = text.trim().split('\n');
  const summary = JSON.parse(lines[lines.length - 1] || '{}');
  const gc = Number(summary.gc_p95_ms || 0);
  const heap = Number(summary.heap_delta_pct || 0);
  gcPause.add(gc);
  heapGrowth.add(heap);
  if (gc > 50 || heap > 1) {
    throw new Error(`GC p95 ${gc}ms or heap growth ${heap}% exceeded thresholds`);
  }
}
