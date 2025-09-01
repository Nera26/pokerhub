#!/usr/bin/env ts-node
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Dirent } from 'fs';

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
    if (file.endsWith('spectator-privacy.yml')) continue;
    const content = readFileSync(file, 'utf-8');
    if (!/^\s*(?:['"])?on(?:['"])?:/m.test(content)) continue;
    if (!content.includes('uses: ./.github/workflows/spectator-privacy.yml')) {
      const relative = file.replace(`${process.cwd()}/`, '');
      missing.push(relative);
    }
  }

  if (missing.length > 0) {
    console.error(
      `Missing spectator-privacy job in: ${missing.join(', ')}`,
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
