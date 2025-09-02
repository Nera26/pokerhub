#!/usr/bin/env ts-node
import { readFileSync, writeFileSync } from 'fs';
import { DlpServiceClient } from '@google-cloud/dlp';

async function scan(files: string[]): Promise<void> {
  const projectId =
    process.env.GCP_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    throw new Error('GCP_PROJECT_ID env var required');
  }
  const client = new DlpServiceClient();
  const findingsSummary: Array<{ file: string; findings: number }> = [];
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const request = {
      parent: `projects/${projectId}/locations/global`,
      item: { value: content },
    } as const;
    const [response] = await client.inspectContent(request);
    const findings = response.result?.findings || [];
    if (findings.length > 0) {
      findingsSummary.push({ file, findings: findings.length });
      console.error(`DLP findings in ${file}:`);
      for (const f of findings) {
        console.error(`- ${f.infoType?.name || 'UNKNOWN'} (${f.likelihood})`);
      }
    }
  }
  if (findingsSummary.length > 0) {
    throw new Error('DLP detected sensitive info');
  }
  writeFileSync(
    'dlp-scan.json',
    JSON.stringify({ status: 'clean', files }, null, 2),
  );
}

if (typeof require !== 'undefined' && require.main === module) {
  scan(process.argv.slice(2)).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

export { scan };
