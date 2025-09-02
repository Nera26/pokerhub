#!/usr/bin/env ts-node
import { execSync } from 'child_process';

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repo) fail('GITHUB_REPOSITORY not set');
if (!token) fail('GITHUB_TOKEN not set');

interface Check {
  file: string;
  env: string;
  defaultSla: number;
}

const checks: Check[] = [
  { file: 'dr-drill.yml', env: 'DR_DRILL_SLA_DAYS', defaultSla: 30 },
  { file: 'dr-failover.yml', env: 'DR_FAILOVER_SLA_DAYS', defaultSla: 30 },
  { file: 'dr-restore.yml', env: 'DR_RESTORE_SLA_DAYS', defaultSla: 30 },
];

for (const { file, env, defaultSla } of checks) {
  let raw: string;
  try {
    raw = execSync(
      `curl -sSfL -H "Authorization: Bearer ${token}" -H 'Accept: application/vnd.github+json' ` +
        `https://api.github.com/repos/${repo}/actions/workflows/${file}/runs?status=success&per_page=1`,
      { encoding: 'utf-8' },
    );
  } catch {
    fail(`Failed to fetch runs for ${file}`);
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    fail(`Unable to parse response for ${file}`);
  }

  const run = data?.workflow_runs?.[0];
  if (!run) {
    fail(`No successful runs for ${file}`);
  }

  const ts = new Date(run.updated_at ?? run.created_at);
  if (isNaN(ts.getTime())) {
    fail(`Invalid timestamp for ${file}`);
  }

  const now = new Date();
  const diffDays = (now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24);
  const limit = Number(process.env[env] || defaultSla);
  if (diffDays > limit) {
    fail(`${file} last succeeded ${ts.toISOString()} is older than ${limit} days`);
  }

  console.log(`${file} last succeeded ${ts.toISOString()} (${Math.floor(diffDays)} days ago)`);
}
