#!/usr/bin/env ts-node
import { readdirSync, readFileSync, Dirent, existsSync, statSync } from 'fs';
import { join } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml');

function collectWorkflowDirs(root: string): string[] {
  const dirs: string[] = [];
  function walk(dir: string) {
    const ghDir = join(dir, '.github');
    const wfDir = join(ghDir, 'workflows');
    if (existsSync(wfDir) && statSync(wfDir).isDirectory()) dirs.push(wfDir);
    if (existsSync(ghDir) && statSync(ghDir).isDirectory()) dirs.push(ghDir);
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        walk(join(dir, entry.name));
      }
    }
  }
  walk(root);
  return dirs;
}

function collectYamlFiles(dir: string): string[] {
  let files: string[] = [];
  const entries: Dirent[] = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(collectYamlFiles(fullPath));
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
  const workflowDirs = collectWorkflowDirs(process.cwd());
  const files = workflowDirs.flatMap(collectYamlFiles);
  const missingIf: string[] = [];
  const missingMetrics: string[] = [];
  const CONDITION = /\$\{\{\s*always\(\)\s*\}\}/;

  for (const file of files) {
    if (file.endsWith('soak-metrics.yml') || file.endsWith('soak.yml')) continue;

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
    const soakJobs: string[] = [];
    const metricsJobs: { name: string; needs: string[] }[] = [];

    for (const [name, job] of Object.entries<any>(jobs)) {
      if (typeof job.uses === 'string') {
        if (job.uses.includes('soak.yml')) {
          soakJobs.push(name);
          if (!CONDITION.test(String(job.if ?? ''))) {
            missingIf.push(`${relative}:${name}`);
          }
        } else if (job.uses.includes('soak-metrics.yml')) {
          const needs = Array.isArray(job.needs)
            ? job.needs
            : job.needs
            ? [job.needs]
            : [];
          metricsJobs.push({ name, needs });
          if (!CONDITION.test(String(job.if ?? ''))) {
            missingIf.push(`${relative}:${name}`);
          }
        }
      }
    }

    for (const sj of soakJobs) {
      const hasDownstream = metricsJobs.some((mj) => mj.needs.includes(sj));
      if (!hasDownstream) missingMetrics.push(`${relative}:${sj}`);
    }
  }

  if (missingIf.length > 0 || missingMetrics.length > 0) {
    if (missingIf.length > 0) {
      console.error("Missing 'if: ${{ always() }}' in soak jobs:");
      for (const file of missingIf) console.error(`  - ${file}`);
    }
    if (missingMetrics.length > 0) {
      console.error('Workflows invoking soak.yml must have downstream soak-metrics job:');
      for (const item of missingMetrics) console.error(`  - ${item}`);
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
