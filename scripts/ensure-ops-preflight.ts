#!/usr/bin/env ts-node
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml');

function main() {
  const workflowsDir = join(process.cwd(), '.github', 'workflows');
  const files = readdirSync(workflowsDir).filter((f) =>
    f.endsWith('.yml') || f.endsWith('.yaml'),
  );
  const missingAction: string[] = [];
  const missingIf: string[] = [];

  for (const file of files) {
    if (file.includes('ops-preflight')) continue;
    const content = readFileSync(join(workflowsDir, file), 'utf-8');
    const doc = yaml.load(content) as any;
    const jobs = doc?.jobs ?? {};
    let found = false;
    for (const [jobName, job] of Object.entries<any>(jobs)) {
      const steps: any[] = Array.isArray(job.steps) ? job.steps : [];
      const stepWithOps = steps.find(
        (s) => typeof s.uses === 'string' && s.uses.includes('./.github/actions/ops-preflight'),
      );
      if (jobName === 'ops-preflight' || stepWithOps) {
        found = true;
        const ifCondition = stepWithOps?.if ?? job.if;
        if (!ifCondition || !/\$\{\{\s*always\(\)\s*\}\}/.test(String(ifCondition))) {
          missingIf.push(file);
        }
        break;
      }
    }
    if (!found) {
      missingAction.push(file);
    }
  }

  if (missingAction.length > 0) {
    console.error(`Missing ops-preflight action in: ${missingAction.join(', ')}`);
  }
  if (missingIf.length > 0) {
    console.error(
      `Missing if: \${{ always() }} condition in ops-preflight job/step for: ${missingIf.join(', ')}`,
    );
  }
  if (missingAction.length > 0 || missingIf.length > 0) {
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
