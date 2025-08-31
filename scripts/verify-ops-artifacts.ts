#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { checkBucketRetention } from './bucket-retention';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`${name} env var required`);
  }
  return val;
}

export const gcloud = {
  run(cmd: string, encoding: BufferEncoding | undefined = 'utf-8'): string | Buffer {
    return execSync(`gcloud storage ${cmd}`, {
      encoding: encoding as any,
    });
  },
};

function assertFresh(uri: string, label: string) {
  let metaRaw: string;
  try {
    metaRaw = gcloud.run(`ls --format=json ${uri}`) as string;
  } catch {
    throw new Error(`Missing ${label} at ${uri}`);
  }
  let meta: Array<{ timeCreated?: string; updated?: string }> = [];
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    throw new Error(`Unable to parse metadata for ${label} at ${uri}`);
  }
  const ts = Date.parse(meta[0]?.timeCreated || meta[0]?.updated || '');
  if (isNaN(ts)) {
    throw new Error(`No timestamp for ${label} at ${uri}`);
  }
  const age = Date.now() - ts;
  const limit = 24 * 60 * 60 * 1000;
  if (age > limit) {
    throw new Error(`${label} at ${uri} is older than 24h`);
  }
}

function checkProofArchive(bucket: string) {
  const base = `gs://${bucket}/latest`;
  let manifest: string;
  try {
    manifest = gcloud.run(`cat ${base}/manifest.txt`) as string;
  } catch {
    throw new Error(`Missing manifest at ${base}/manifest.txt`);
  }
  const lines = manifest
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  let ok = true;
  for (const line of lines) {
    const [hash, file] = line.split(/\s+/);
    if (!hash || !file) continue;
    try {
      const data = gcloud.run(`cat ${base}/${file}`, undefined) as Buffer;
      const digest = createHash('sha256').update(data).digest('hex');
      if (digest !== hash) {
        console.error(`${file}: checksum mismatch`);
        ok = false;
      }
      assertFresh(`${base}/${file}`, `proof archive file ${file}`);
    } catch (err) {
      console.error(`${file}: ${(err as Error).message}`);
      ok = false;
    }
  }
  assertFresh(`${base}/manifest.txt`, 'proof archive manifest');
  if (!ok) {
    throw new Error('Proof archive validation failed');
  }
}

function checkSpectatorLogs(bucket: string, runId: string) {
  console.log(`Fetching spectator privacy logs for run ${runId}`);
  let listing: string;
  try {
    listing = gcloud.run(
      `ls --format=json gs://${bucket}/${runId}/**`,
    ) as string;
  } catch {
    throw new Error(`Missing spectator privacy logs in gs://${bucket}/${runId}/`);
  }
  let items: Array<{ timeCreated?: string; updated?: string }> = [];
  try {
    items = JSON.parse(listing);
  } catch {
    throw new Error(
      `Unable to parse listing for gs://${bucket}/${runId}/`,
    );
  }
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent = items.some((obj) => {
    const t = Date.parse(obj.timeCreated || obj.updated || '');
    return !isNaN(t) && t >= cutoff;
  });
  if (!recent) {
    throw new Error(
      `Spectator privacy logs in gs://${bucket}/${runId}/ are older than 24h`,
    );
  }
}

function checkSoakMetrics(bucket: string) {
  let listing: string;
  try {
    listing = gcloud.run(
      `ls --format=json gs://${bucket}/soak/latest/**`,
    ) as string;
  } catch {
    throw new Error(
      `Missing soak metrics in gs://${bucket}/soak/latest/`,
    );
  }
  let items: Array<{ timeCreated?: string; updated?: string }> = [];
  try {
    items = JSON.parse(listing);
  } catch {
    throw new Error(
      `Unable to parse listing for gs://${bucket}/soak/latest/`,
    );
  }
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent = items.some((obj) => {
    const t = Date.parse(obj.timeCreated || obj.updated || '');
    return !isNaN(t) && t >= cutoff;
  });
  if (!recent) {
    throw new Error(
      `Soak metrics in gs://${bucket}/soak/latest/ are older than 24h`,
    );
  }
}

function checkSoakSummary(
  bucket: string,
  maxLatencyP95: number,
  minThroughput: number,
) {
  const uri = `gs://${bucket}/soak/latest/soak-summary.json`;
  let raw: string;
  try {
    raw = gcloud.run(`cat ${uri}`) as string;
  } catch {
    throw new Error(`Missing soak summary at ${uri}`);
  }
  let summary: any;
  try {
    summary = JSON.parse(raw);
  } catch {
    throw new Error(`Unable to parse soak summary at ${uri}`);
  }
  const latP95 = Number(
    summary?.metrics?.ack_latency?.['p(95)'] ??
      summary?.metrics?.ws_latency?.['p(95)'],
  );
  const count = Number(
    summary?.metrics?.ack_latency?.count ??
      summary?.metrics?.ws_latency?.count,
  );
  const durationMs = Number(summary?.state?.testRunDurationMs);
  const throughput =
    durationMs > 0 ? count / (durationMs / 1000) : Number.NaN;
  if (!isFinite(latP95)) {
    throw new Error(`Missing latency p95 in soak summary at ${uri}`);
  }
  if (!isFinite(throughput)) {
    throw new Error(`Missing throughput in soak summary at ${uri}`);
  }
  if (latP95 > maxLatencyP95) {
    throw new Error(
      `Latency p95 ${latP95}ms exceeds ${maxLatencyP95}ms threshold`,
    );
  }
  if (throughput < minThroughput) {
    throw new Error(
      `Throughput ${throughput} < ${minThroughput} threshold`,
    );
  }
}

function checkSoakTrendDelta(bucket: string, maxPct: number) {
  const uri = `gs://${bucket}/soak/latest/trend-delta.json`;
  let raw: string;
  try {
    raw = gcloud.run(`cat ${uri}`) as string;
  } catch {
    throw new Error(`Missing soak trend delta at ${uri}`);
  }
  let trend: any;
  try {
    trend = JSON.parse(raw);
  } catch {
    throw new Error(`Unable to parse soak trend delta at ${uri}`);
  }
  const latP95 = Number(trend?.latency?.p95);
  const throughput = Number(trend?.throughput);
  if (!isFinite(latP95)) {
    throw new Error(`Missing latency.p95 in soak trend delta at ${uri}`);
  }
  if (!isFinite(throughput)) {
    throw new Error(`Missing throughput in soak trend delta at ${uri}`);
  }
  if (latP95 > maxPct) {
    throw new Error(
      `Latency p95 regression ${latP95}% exceeds ${maxPct}% threshold`,
    );
  }
  if (throughput < -maxPct) {
    throw new Error(
      `Throughput regression ${Math.abs(throughput)}% exceeds ${maxPct}% threshold`,
    );
  }
}

function checkDrMetrics(bucket: string) {
  let listing: string;
  try {
    listing = gcloud.run(
      `ls --format=json gs://${bucket}/**/drill.metrics`,
    ) as string;
  } catch {
    throw new Error(`Missing DR metrics in gs://${bucket}/`);
  }
  let items: Array<{ name: string; timeCreated?: string; updated?: string }> = [];
  try {
    items = JSON.parse(listing);
  } catch {
    throw new Error(`Unable to parse listing for gs://${bucket}/`);
  }
  if (items.length === 0) {
    throw new Error(`Missing DR metrics in gs://${bucket}/`);
  }
  const latest = items.reduce((a, b) => {
    const at = Date.parse(a.timeCreated || a.updated || '');
    const bt = Date.parse(b.timeCreated || b.updated || '');
    return at > bt ? a : b;
  });
  const t = Date.parse(latest.timeCreated || latest.updated || '');
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  if (isNaN(t) || t < cutoff) {
    throw new Error(`DR metrics in gs://${bucket}/ are older than 24h`);
  }
  let metrics: string;
  try {
    metrics = gcloud.run(`cat ${latest.name}`) as string;
  } catch {
    throw new Error(`Unable to read ${latest.name}`);
  }
  const rto = Number(/RTO_SECONDS=(\d+)/.exec(metrics)?.[1]);
  const rpo =
    Number(/RPO_SECONDS=(\d+)/.exec(metrics)?.[1]) ||
    Math.max(
      Number(/RPO_SNAPSHOT_SECONDS=(\d+)/.exec(metrics)?.[1] || NaN),
      Number(/RPO_WAL_SECONDS=(\d+)/.exec(metrics)?.[1] || NaN),
    );
  if (isNaN(rto) || isNaN(rpo)) {
    throw new Error(`Unable to parse RTO/RPO from ${latest.name}`);
  }
  if (rto > 1800) {
    throw new Error(`RTO ${rto}s exceeds 1800s threshold`);
  }
  if (rpo > 300) {
    throw new Error(`RPO ${rpo}s exceeds 300s threshold`);
  }
}

function main() {
  const proofBucket = requireEnv('PROOF_ARCHIVE_BUCKET');
  const spectatorBucket = requireEnv('SPECTATOR_PRIVACY_BUCKET');
  const runId = requireEnv('RUN_ID');
  const soakBucket = requireEnv('SOAK_TRENDS_BUCKET');
  const drMetricsBucket = requireEnv('DR_METRICS_BUCKET');
  const maxLatencyP95 = Number(requireEnv('SOAK_LATENCY_P95_MS'));
  const minThroughput = Number(requireEnv('SOAK_THROUGHPUT_MIN'));
  const maxTrendPct = Number(requireEnv('SOAK_TRENDS_MAX_PCT'));

  const proofRetention = Number(
    process.env.PROOF_ARCHIVE_MIN_RETENTION_DAYS || '365',
  );
  if (!Number.isFinite(proofRetention) || proofRetention <= 0) {
    throw new Error('Invalid PROOF_ARCHIVE_MIN_RETENTION_DAYS');
  }
  const spectatorRetention = Number(
    process.env.SPECTATOR_PRIVACY_MIN_RETENTION_DAYS || '30',
  );
  if (!Number.isFinite(spectatorRetention) || spectatorRetention <= 0) {
    throw new Error('Invalid SPECTATOR_PRIVACY_MIN_RETENTION_DAYS');
  }

  checkBucketRetention(proofBucket, proofRetention);
  checkBucketRetention(spectatorBucket, spectatorRetention);

  checkProofArchive(proofBucket);
  checkSpectatorLogs(spectatorBucket, runId);
  checkSoakMetrics(soakBucket);
  checkSoakSummary(soakBucket, maxLatencyP95, minThroughput);
  checkSoakTrendDelta(soakBucket, maxTrendPct);
  checkDrMetrics(drMetricsBucket);

  console.log('All ops artifacts verified');
}

if (typeof require !== 'undefined' && require.main === module) {
  try {
    main();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

export {
  checkProofArchive,
  checkSpectatorLogs,
  checkSoakMetrics,
  checkSoakSummary,
  checkSoakTrendDelta,
  checkDrMetrics,
};
