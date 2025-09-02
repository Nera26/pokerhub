#!/usr/bin/env ts-node
import { readdirSync, readFileSync, Dirent } from 'fs';
import { join, relative } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml');

function collectYamlFiles(root: string, dir: string = root): string[] {
  const entries: Dirent[] = readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(collectYamlFiles(root, fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml'))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  const workflowsDir = join(process.cwd(), '.github', 'workflows');
  const files = collectYamlFiles(workflowsDir);
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
