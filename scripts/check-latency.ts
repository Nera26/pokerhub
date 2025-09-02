#!/usr/bin/env ts-node
import fs from 'fs';

interface LatencyMetrics {
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
}

const file = 'metrics/ws-latency.json';
if (!fs.existsSync(file)) {
  console.error(`metrics file ${file} not found`);
  process.exit(1);
}
const metrics = JSON.parse(fs.readFileSync(file, 'utf8')) as LatencyMetrics;

const maxP50 = Number(process.env.LATENCY_P50_MS || 50);
const maxP95 = Number(process.env.LATENCY_P95_MS || 120);
const maxP99 = Number(process.env.LATENCY_P99_MS || 200);
const minThroughput = Number(process.env.THROUGHPUT_MIN || 100);

const errors: string[] = [];
if (metrics.p50 > maxP50)
  errors.push(`latency p50 ${metrics.p50}ms exceeds ${maxP50}ms`);
if (metrics.p95 > maxP95)
  errors.push(`latency p95 ${metrics.p95}ms exceeds ${maxP95}ms`);
if (metrics.p99 > maxP99)
  errors.push(`latency p99 ${metrics.p99}ms exceeds ${maxP99}ms`);
if (metrics.throughput < minThroughput)
  errors.push(`throughput ${metrics.throughput} < ${minThroughput}`);

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}
console.log(
  `ws latency metrics: p50=${metrics.p50}ms p95=${metrics.p95}ms p99=${metrics.p99}ms throughput=${metrics.throughput}`,
);
