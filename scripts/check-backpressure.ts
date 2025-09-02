#!/usr/bin/env node
const fs = require('fs');

const file = 'metrics/backpressure.json';
if (!fs.existsSync(file)) {
  console.error(`metrics file ${file} not found`);
  process.exit(1);
}

const metrics = JSON.parse(fs.readFileSync(file, 'utf8'));
const queueLimit = Number(process.env.WS_QUEUE_DEPTH_THRESHOLD || 80);

const errors = [];
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
