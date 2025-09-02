#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const resultsDir = path.resolve('load/results');

const thresholds = {
  p50: Number(process.env.ACK_P50_MS || 40),
  p95: Number(process.env.ACK_P95_MS || 120),
  p99: Number(process.env.ACK_P99_MS || 200),
};

const errors = [];

function check(p50, p95, p99, ctx) {
  if (p50 > thresholds.p50)
    errors.push(`${ctx} latency p50 ${p50}ms exceeds ${thresholds.p50}ms`);
  if (p95 > thresholds.p95)
    errors.push(`${ctx} latency p95 ${p95}ms exceeds ${thresholds.p95}ms`);
  if (p99 > thresholds.p99)
    errors.push(`${ctx} latency p99 ${p99}ms exceeds ${thresholds.p99}ms`);
}

if (fs.existsSync(resultsDir)) {
  for (const file of fs.readdirSync(resultsDir)) {
    if (!file.endsWith('.json')) continue;
    const fullPath = path.join(resultsDir, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch {
      continue;
    }
    if (data.tables) {
      for (const [table, m] of Object.entries(data.tables)) {
        const ack = m.ack_latency || {};
        check(
          ack.p50 ?? 0,
          ack.p95 ?? 0,
          ack.p99 ?? 0,
          `${file} table ${table}`,
        );
      }
    } else if (data.metrics) {
      const metric = data.metrics.ack_latency || data.metrics.ws_latency;
      if (metric) {
        const vals = metric.values || metric;
        check(
          vals['p(50)'] ?? vals.median ?? vals.p50 ?? 0,
          vals['p(95)'] ?? vals.p95 ?? 0,
          vals['p(99)'] ?? vals.p99 ?? 0,
          file,
        );
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('ACK latency within thresholds');

