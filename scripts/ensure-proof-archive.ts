#!/usr/bin/env ts-node
import { readFileSync } from 'fs';
import { relative } from 'path';
import { collectWorkflowDirs, collectYamlFiles } from './workflow-utils.ts';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml');

function main() {
  const workflowDirs = collectWorkflowDirs(process.cwd());
  const files = workflowDirs.flatMap(collectYamlFiles);
  const missingWorkflows: string[] = [];
  const missingConditions: string[] = [];
  const CONDITION = /\$\{\{\s*always\(\)\s*\}\}/;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    let doc: any;
    try {
      doc = yaml.load(content);
    } catch {
      continue;
    }
    if (!doc || typeof doc !== 'object' || !doc.on) continue;

    const jobs: Record<string, any> = doc.jobs ?? {};
    let hasCheck = false;
    for (const [name, job] of Object.entries<any>(jobs)) {
      const uses: string | undefined = job?.uses;
      if (
        name === 'check-proof-archive' ||
        name === 'proof-archive' ||
        (typeof uses === 'string' &&
          (uses.includes('check-proof-archive') ||
            uses.includes('proof-archive')))
      ) {
        hasCheck = true;
        const ifCond = String(job.if ?? '');
        if (!CONDITION.test(ifCond)) {
          const rel = relative(process.cwd(), file);
          missingConditions.push(`${rel}:${name}`);
        }
      }
    }

    if (
      !file.endsWith('check-proof-archive.yml') &&
      !file.endsWith('proof-archive.yml') &&
      !hasCheck
    ) {
      missingWorkflows.push(relative(process.cwd(), file));
    }
  }

  if (missingWorkflows.length > 0 || missingConditions.length > 0) {
    if (missingWorkflows.length > 0) {
      console.error(
        `Missing proof-archive verification in: ${missingWorkflows.join(', ')}`,
      );
    }
    if (missingConditions.length > 0) {
      console.error(
        'Missing `if: ${{ always() }}` for jobs: ' +
          missingConditions.join(', '),
      );
    }
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
