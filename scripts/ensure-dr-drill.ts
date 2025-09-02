#!/usr/bin/env ts-node
import { writeFileSync } from 'fs';
import { BigQuery } from '@google-cloud/bigquery';
import { getOctokit } from '@actions/github';

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

async function main() {
  const bigquery = new BigQuery({ projectId: process.env.GCP_PROJECT_ID });
  let rows: any[];
  try {
    [rows] = await bigquery.query({
      query:
        'SELECT timestamp FROM ops_metrics.dr_drill_runs ORDER BY timestamp DESC LIMIT 1',
    });
  } catch {
    fail('Failed to query BigQuery');
  }

  const tsField = rows?.[0]?.timestamp as any;
  const ts = tsField?.value || tsField;
  if (!ts) {
    fail('No DR drill metrics found');
  }

  const latest = new Date(ts);
  if (isNaN(latest.getTime())) {
    fail(`Invalid timestamp: ${ts}`);
  }

  const now = new Date();
  const diffDays = (now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24);
  const limit = Number(process.env.DR_DRILL_SLA_DAYS || '30');
  if (diffDays > limit) {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPOSITORY;
    if (!token || !repo) {
      fail(`Latest DR drill ${ts} is older than ${limit} days`);
    }
    const [owner, repoName] = repo.split('/');
    const github = getOctokit(token);
    const issue = await github.rest.issues.create({
      owner,
      repo: repoName,
      title: 'DR drill overdue',
      body: `Latest DR drill ${ts} is older than ${limit} days.`,
    });
    writeFileSync('dr-drill-issue.json', JSON.stringify(issue.data, null, 2));
    console.log(`Opened issue ${issue.data.html_url}`);
    return;
  }

  console.log(`Latest DR drill ${ts} is ${Math.floor(diffDays)} days old`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
