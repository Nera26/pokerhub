#!/usr/bin/env ts-node
import {
  readdirSync,
  readFileSync,
  Dirent,
  existsSync,
} from 'fs';
import { join } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require('js-yaml');

function collectWorkflowDirs(dir: string): string[] {
  const entries: Dirent[] = readdirSync(dir, { withFileTypes: true });
  let dirs: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = join(dir, entry.name);
    if (entry.name === '.github') {
      const wf = join(fullPath, 'workflows');
      if (existsSync(wf)) dirs.push(wf);
    }
    dirs = dirs.concat(collectWorkflowDirs(fullPath));
  }
  return dirs;
}

function collectYamlFiles(dir: string): string[] {
  const entries: Dirent[] = readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];
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

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
