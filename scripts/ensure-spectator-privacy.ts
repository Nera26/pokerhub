#!/usr/bin/env ts-node
import { readFileSync } from 'fs';
import { collectWorkflowDirs, collectYamlFiles } from './workflow-utils.ts';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml');
export function main() {
  const workflowDirs = collectWorkflowDirs(process.cwd());
  const files = workflowDirs.flatMap(collectYamlFiles);
  const missing: string[] = [];
  const missingIf: string[] = [];
  const CONDITION = /\$\{\{\s*always\(\)\s*\}\}/;

  for (const file of files) {
    if (file.endsWith('spectator-privacy.yml')) continue;
    const content = readFileSync(file, 'utf-8');
    let doc: any;
    try {
      doc = yaml.load(content);
    } catch {
      continue;
    }
    if (!doc || typeof doc !== 'object' || !doc.on) continue;

    const relative = file.replace(`${process.cwd()}/`, '');
    const jobs: Record<string, any> = doc.jobs ?? {};
    let found = false;

    for (const job of Object.values<any>(jobs)) {
      if (typeof job.uses === 'string' && job.uses.includes('spectator-privacy.yml')) {
        found = true;
        const ifCond = String(job.if ?? '');
        if (!CONDITION.test(ifCond)) {
          missingIf.push(relative);
        }
      }
    }

    if (!found) missing.push(relative);
  }

  if (missing.length > 0 || missingIf.length > 0) {
    if (missing.length > 0) {
      console.error(`Missing spectator-privacy job in: ${missing.join(', ')}`);
    }
    if (missingIf.length > 0) {
      console.error(
        "Missing 'if: ${{ always() }}' in spectator-privacy job in: " +
          missingIf.join(', '),
      );
    }
    process.exit(1);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
