#!/usr/bin/env ts-node
import fs from 'fs';

interface BackpressureMetrics {
  maxQueueDepth: number;
  gameActionGlobalCount: number;
  gameActionGlobalLimit: number;
  globalLimitExceeded: number;
}

const metrics = JSON.parse(
  fs.readFileSync('metrics/backpressure.json', 'utf8'),
) as BackpressureMetrics;
const queueLimit = Number(process.env.WS_QUEUE_DEPTH_THRESHOLD || 80);

const errors: string[] = [];
if (metrics.maxQueueDepth > queueLimit) {
  errors.push(`queue depth ${metrics.maxQueueDepth} exceeds ${queueLimit}`);
}
if (metrics.gameActionGlobalCount > metrics.gameActionGlobalLimit) {
  errors.push(
    `global actions ${metrics.gameActionGlobalCount} exceed limit ${metrics.gameActionGlobalLimit}`,
  );
}
if (metrics.globalLimitExceeded > 0) {
  errors.push(`global limit exceeded ${metrics.globalLimitExceeded}`);
}

if (errors.length) {
  console.error(errors.join('; '));
  process.exit(1);
}

console.log(
  `backpressure ok: depth=${metrics.maxQueueDepth} global=${metrics.gameActionGlobalCount}/${metrics.gameActionGlobalLimit}`,
);
