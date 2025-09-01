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
      const relative = file.replace(`${process.cwd()}/`, '');
      missingWorkflows.push(relative);
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
        const relative = file.replace(`${process.cwd()}/`, '');
        missingConditions.push(`${relative}:${match[2]}`);
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
