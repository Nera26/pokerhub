#!/usr/bin/env ts-node
import { checkSpectatorPrivacyMetric } from './verify-ops-artifacts.ts';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`${name} env var required`);
  }
  return val;
}

function main() {
  const projectId = requireEnv('GCP_PROJECT_ID');
  const sla = Number(requireEnv('SPECTATOR_PRIVACY_SLA_HOURS'));
  checkSpectatorPrivacyMetric(projectId, sla);
}

if (typeof require !== 'undefined' && require.main === module) {
  try {
    main();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
