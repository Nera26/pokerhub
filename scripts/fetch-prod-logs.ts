#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`${name} env var required`);
    process.exit(1);
  }
  return val;
}

function fetchLogs(service: string, projectId: string): string {
  const file = `${service}-prod.log`;
  const filter = `resource.labels.service_name="${service}" AND textPayload:"spectator"`;
  const cmd = `gcloud logging read '${filter}' --project=${projectId} --freshness=24h --format=json`;
  const output = execSync(cmd, { encoding: 'utf8' });
  writeFileSync(file, output);
  return file;
}

function main() {
  const projectId = requireEnv('GCP_PROJECT_ID');
  const services = ['backend', 'frontend'];
  const files = services.map((s) => fetchLogs(s, projectId));
  console.log(files.join(' '));
}

main();
