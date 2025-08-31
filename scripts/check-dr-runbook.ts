#!/usr/bin/env ts-node
import fs from 'fs';
import path from 'path';

const marker = '<!-- DR_DRILL_RESULTS -->';
const runbookPath = path.join(__dirname, '..', 'docs', 'runbooks', 'disaster-recovery.md');

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const content = fs.readFileSync(runbookPath, 'utf-8');
const idx = content.indexOf(marker);
if (idx === -1) {
  fail('DR_DRILL_RESULTS marker not found');
}

const after = content.slice(idx + marker.length);
const matches = [...after.matchAll(/\d{4}-\d{2}-\d{2}/g)].map(m => m[0]);
if (matches.length === 0) {
  fail('No drill timestamps found');
}

matches.sort();
const latestStr = matches[matches.length - 1];
const latest = new Date(latestStr);
if (isNaN(latest.getTime())) {
  fail(`Invalid date parsed: ${latestStr}`);
}

const now = new Date();
const diffDays = (now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24);
if (diffDays > 30) {
  fail(`Latest drill ${latestStr} is older than 30 days`);
}

console.log(`Latest drill ${latestStr} is ${Math.floor(diffDays)} days old`);
