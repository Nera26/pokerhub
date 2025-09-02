#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const dir = path.resolve('load/results');
let files = [];
try {
  files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
} catch {
  console.error(`results directory ${dir} not found`);
  process.exit(1);
}

if (files.length === 0) {
  console.error('no result files found');
  process.exit(1);
}

const maxP50 = Number(process.env.ACK_P50_MS || 40);
const maxP95 = Number(process.env.ACK_P95_MS || 120);
const maxP99 = Number(process.env.ACK_P99_MS || 200);

const errors = [];
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  if (data.tables) {
    for (const [table, info] of Object.entries(data.tables)) {
      const { p50 = 0, p95 = 0, p99 = 0 } = info.ack_latency || {};
      if (p50 > maxP50)
        errors.push(`${file} table ${table} p50 ${p50}ms exceeds ${maxP50}ms`);
      if (p95 > maxP95)
        errors.push(`${file} table ${table} p95 ${p95}ms exceeds ${maxP95}ms`);
      if (p99 > maxP99)
        errors.push(`${file} table ${table} p99 ${p99}ms exceeds ${maxP99}ms`);
    }
  } else if (data.metrics) {
    const ack = data.metrics.ack_latency || data.metrics.ws_latency;
    if (ack) {
      const p50 = Number(ack['p(50)'] ?? ack.p50 ?? ack.median ?? 0);
      const p95 = Number(ack['p(95)'] ?? 0);
      const p99 = Number(ack['p(99)'] ?? 0);
      if (p50 > maxP50)
        errors.push(`${file} p50 ${p50}ms exceeds ${maxP50}ms`);
      if (p95 > maxP95)
        errors.push(`${file} p95 ${p95}ms exceeds ${maxP95}ms`);
      if (p99 > maxP99)
        errors.push(`${file} p99 ${p99}ms exceeds ${maxP99}ms`);
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}
console.log(`latency within thresholds for ${files.length} files (p50<${maxP50}ms p95<${maxP95}ms p99<${maxP99}ms)`);
