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
const lines = content.split('\n');
const markerIndex = lines.findIndex(l => l.includes(marker));
if (markerIndex === -1) {
  fail('DR_DRILL_RESULTS marker not found');
}

const afterLines = lines.slice(markerIndex + 1);
const matches = [...afterLines.join('\n').matchAll(/\d{4}-\d{2}-\d{2}/g)].map(m => m[0]);
if (matches.length === 0) {
  fail('No drill timestamps found');
}

matches.sort();
const latestStr = matches[matches.length - 1];
const entryIdx = afterLines.findIndex(l => l.includes(latestStr));
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

if (entryIdx !== -1) {
  const entryLine = afterLines[entryIdx];
  const m = entryLine.match(/RTO (\d+)s, snapshot RPO (\d+)s, WAL RPO (\d+)s(?:, failover (\d+)s, primary restore (\d+)s)?/);
  if (m) {
    const extra = m[4] ? `, failover ${m[4]}s, primary restore ${m[5]}s` : '';
    console.log(`Latest metrics – RTO ${m[1]}s, snapshot RPO ${m[2]}s, WAL RPO ${m[3]}s${extra}`);
  }
}

if (process.env.APPEND_RUN_ID === 'true' && entryIdx !== -1) {
  const runId = process.env.GITHUB_RUN_ID;
  if (runId) {
    const repo = process.env.GITHUB_REPOSITORY;
    const runUrl = repo ? `https://github.com/${repo}/actions/runs/${runId}` : runId;
    const globalIndex = markerIndex + 1 + entryIdx;
    if (!lines[globalIndex].includes(runId)) {
      lines[globalIndex] += ` ([run ${runId}](${runUrl}))`;
      fs.writeFileSync(runbookPath, lines.join('\n'));
    }
  }
}

