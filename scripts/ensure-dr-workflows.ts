#!/usr/bin/env ts-node
import { execSync } from 'child_process';

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

interface Check {
  name: string;
  env: string;
  defaultSla: number;
}

function main() {
  const project = process.env.GCP_PROJECT_ID ? `--project_id=${process.env.GCP_PROJECT_ID} ` : '';
  const checks: Check[] = [
    { name: 'dr-failover', env: 'DR_FAILOVER_SLA_DAYS', defaultSla: 30 },
    { name: 'dr-restore', env: 'DR_RESTORE_SLA_DAYS', defaultSla: 30 },
    { name: 'dr-throwaway', env: 'DR_THROWAWAY_SLA_DAYS', defaultSla: 30 },
    { name: 'dr-drill', env: 'DR_DRILL_SLA_DAYS', defaultSla: 30 },
  ];

  for (const { name, env, defaultSla } of checks) {
    let raw: string;
    try {
      raw = execSync(
        `bq ${project}--format=json query --nouse_legacy_sql "SELECT timestamp FROM ops_metrics.dr_workflow_runs WHERE workflow='${name}' ORDER BY timestamp DESC LIMIT 1"`,
        { encoding: 'utf-8' },
      );
    } catch {
      fail(`Failed to query BigQuery for ${name}`);
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      fail(`Unable to parse BigQuery response for ${name}`);
    }

    const ts = data?.[0]?.timestamp;
    if (!ts) {
      fail(`No runs found for ${name}`);
    }

    const latest = new Date(ts);
    if (isNaN(latest.getTime())) {
      fail(`Invalid timestamp for ${name}: ${ts}`);
    }

    const now = new Date();
    const diffDays = (now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24);
    const limit = Number(process.env[env] || defaultSla);
    if (diffDays > limit) {
      fail(`Latest ${name} run ${ts} is older than ${limit} days`);
    }

    console.log(`${name} last ran ${ts} (${Math.floor(diffDays)} days ago)`);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
