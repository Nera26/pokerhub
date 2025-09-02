#!/usr/bin/env ts-node
import {
  readdirSync,
  readFileSync,
  Dirent,
  existsSync,
} from 'fs';
import { join, relative } from 'path';

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
  const missingWorkflows: string[] = [];
  const missingConditions: string[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    if (!/^\s*(?:['"])?on(?:['"])?:/m.test(content)) continue;

    const hasCheck = content.includes('check-proof-archive');
    const hasArchive = content.includes('proof-archive');

    if (
      !file.endsWith('check-proof-archive.yml') &&
      !file.endsWith('proof-archive.yml') &&
      !hasCheck &&
      !hasArchive
    ) {
      const rel = relative(process.cwd(), file);
      missingWorkflows.push(rel);
    }

    const jobRegex = /^([ \t]*)(check-proof-archive|proof-archive):/gm;
    let match: RegExpExecArray | null;
    while ((match = jobRegex.exec(content)) !== null) {
      const indent = match[1];
      const rest = content.slice(match.index + match[0].length);
      const lines = rest.split('\n');
      let hasIfAlways = false;
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (!line.startsWith(indent + '  ')) break;
        if (line.trim().startsWith('if:') && line.includes('${{ always() }}')) {
          hasIfAlways = true;
          break;
        }
      }
      if (!hasIfAlways) {
        const rel = relative(process.cwd(), file);
        missingConditions.push(`${rel}:${match[2]}`);
      }
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
