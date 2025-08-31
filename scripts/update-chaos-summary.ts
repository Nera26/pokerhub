#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';

function percentile(hist: Record<string, number>, p: number): number {
  const entries = Object.entries(hist).map(([k, v]) => [Number(k), Number(v)] as [number, number]);
  entries.sort((a, b) => a[0] - b[0]);
  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  let cumulative = 0;
  for (const [bucket, count] of entries) {
    cumulative += count;
    if (cumulative / total >= p) return bucket;
  }
  return entries.length ? entries[entries.length - 1][0] : 0;
}

function loadHist(dir: string, file: string): Record<string, number> {
  return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')) as Record<string, number>;
}

function deviation(base: number, cur: number): number {
  return base === 0 ? Infinity : (cur - base) / base;
}

const baselineDir = process.argv[2];
if (!baselineDir) {
  console.error('Usage: update-chaos-summary.ts <baseline_dir>');
  process.exit(1);
}

const repoRoot = path.join(__dirname, '..');
const metricsRoot = path.join(repoRoot, 'load', 'metrics');
const runDirs = fs
  .readdirSync(metricsRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{8}-\d{6}$/.test(d.name))
  .map((d) => d.name)
  .sort();
if (runDirs.length === 0) {
  console.error('No metrics runs found');
  process.exit(1);
}
const latestRun = runDirs[runDirs.length - 1];
const latestDir = path.join(metricsRoot, latestRun);

const docPath = path.join(repoRoot, 'docs', 'load-testing.md');
const doc = fs.readFileSync(docPath, 'utf-8');
if (doc.includes(latestRun)) {
  console.log('Chaos summary already up to date');
  process.exit(0);
}

const ack = loadHist(latestDir, 'ack-histogram.json');
const gc = loadHist(latestDir, 'gc-histogram.json');
const heap = loadHist(latestDir, 'heap-histogram.json');

const baseAck = loadHist(baselineDir, 'ack-histogram.json');
const baseGc = loadHist(baselineDir, 'gc-histogram.json');
const baseHeap = loadHist(baselineDir, 'heap-histogram.json');

const ackP95 = percentile(ack, 0.95);
const ackP99 = percentile(ack, 0.99);
const baseAckP95 = percentile(baseAck, 0.95);
const baseAckP99 = percentile(baseAck, 0.99);

const gcP95 = percentile(gc, 0.95);
const gcP99 = percentile(gc, 0.99);
const baseGcP95 = percentile(baseGc, 0.95);
const baseGcP99 = percentile(baseGc, 0.99);

const heapP95 = percentile(heap, 0.95);
const heapP99 = percentile(heap, 0.99);
const baseHeapP95 = percentile(baseHeap, 0.95);
const baseHeapP99 = percentile(baseHeap, 0.99);

const regressions: string[] = [];
const fmtDev = (d: number) => (d * 100).toFixed(2);
if (deviation(baseAckP95, ackP95) > 0.05 || deviation(baseAckP99, ackP99) > 0.05) {
  regressions.push(`ack latency regression p95 dev ${fmtDev(deviation(baseAckP95, ackP95))}% p99 dev ${fmtDev(deviation(baseAckP99, ackP99))}%`);
}
if (deviation(baseGcP95, gcP95) > 0.05 || deviation(baseGcP99, gcP99) > 0.05) {
  regressions.push(`gc pause regression p95 dev ${fmtDev(deviation(baseGcP95, gcP95))}% p99 dev ${fmtDev(deviation(baseGcP99, gcP99))}%`);
}
if (deviation(baseHeapP95, heapP95) > 0.05 || deviation(baseHeapP99, heapP99) > 0.05) {
  regressions.push(`heap used regression p95 dev ${fmtDev(deviation(baseHeapP95, heapP95))}% p99 dev ${fmtDev(deviation(baseHeapP99, heapP99))}%`);
}

if (regressions.length) {
  console.error(regressions.join('\n'));
  process.exit(1);
}
const toMB = (v: number) => Math.round(v / (1024 * 1024));

const summary = [
  `Latest run \`${latestRun}\``,
  `- ack p95 ${ackP95}ms p99 ${ackP99}ms`,
  `- gc pause p95 ${gcP95}ms p99 ${gcP99}ms`,
  `- heap used p95 ${toMB(heapP95)}MB p99 ${toMB(heapP99)}MB`,
  `[metrics](../load/metrics/${latestRun})`,
].join('\n');

const heading = '## Nightly chaos run summaries';
const marker = '<!-- CHAOS_SUMMARY -->';
const headingIdx = doc.indexOf(heading);
if (headingIdx === -1) {
  console.error('Heading not found in docs/load-testing.md');
  process.exit(1);
}
const prefix = doc.slice(0, headingIdx + heading.length) + '\n\n';
const newDoc = `${prefix}${summary}\n\n${marker}\n`;
if (newDoc === doc) {
  console.log('No changes required');
  process.exit(0);
}
fs.writeFileSync(docPath, newDoc);
console.log('Updated chaos summary');
