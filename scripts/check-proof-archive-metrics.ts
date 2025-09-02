#!/usr/bin/env ts-node
import { execSync } from 'child_process';

const minRetention = Number(process.env.PROOF_ARCHIVE_MIN_RETENTION_DAYS || '365');
const maxLag = Number(
  process.env.PROOF_ARCHIVE_REPLICATION_LAG_THRESHOLD_SECONDS || '600',
);

let rows: {
  retention_days: number;
  replication_lag_seconds: number;
}[];
try {
  const out = execSync(
    "bq query --nouse_legacy_sql --format=json 'SELECT retention_days, replication_lag_seconds FROM ops_metrics.proof_archive_metrics ORDER BY timestamp DESC LIMIT 1'",
    { encoding: 'utf-8' },
  );
  rows = JSON.parse(out);
} catch {
  console.error('Failed to query BigQuery for proof archive metrics');
  process.exit(1);
}

if (rows.length === 0) {
  console.error('No proof archive metrics in BigQuery');
  process.exit(1);
}

const { retention_days, replication_lag_seconds } = rows[0];

if (retention_days < minRetention) {
  console.error(
    `Retention days ${retention_days} < required ${minRetention}`,
  );
  process.exit(1);
}

if (replication_lag_seconds > maxLag) {
  console.error(
    `Replication lag ${replication_lag_seconds}s exceeds ${maxLag}s`,
  );
  process.exit(1);
}

console.log(
  `Proof archive retention ${retention_days}d and replication lag ${replication_lag_seconds}s within thresholds`,
);
