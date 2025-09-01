#!/usr/bin/env ts-node
import { readdirSync, readFileSync, Dirent } from 'fs';
import { join } from 'path';

function collectYamlFiles(dir: string): string[] {
  const entries: Dirent[] = readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(collectYamlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.yml')) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  const workflowsDir = join(process.cwd(), '.github', 'workflows');
  const files = collectYamlFiles(workflowsDir);
  const missing: string[] = [];

  for (const file of files) {
    if (file.endsWith('check-proof-archive.yml') || file.endsWith('proof-archive.yml')) continue;
    const content = readFileSync(file, 'utf-8');
    if (!/^\s*(?:['"])?on(?:['"])?:/m.test(content)) continue;
    if (!content.includes('check-proof-archive') && !content.includes('proof-archive')) {
      const relative = file.replace(`${process.cwd()}/`, '');
      missing.push(relative);
    }
  }

  if (missing.length > 0) {
    console.error(
      `Missing proof-archive verification in: ${missing.join(', ')}`,
    );
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
