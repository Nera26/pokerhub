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
  const missing: string[] = [];
  const missingIf: string[] = [];
  const CONDITION = '${{ always() }}';

  for (const file of files) {
    if (file.endsWith('ops-artifacts-verify.yml')) continue;
    const content = readFileSync(file, 'utf-8');
    if (!/^\s*(?:['"])?on(?:['"])?:/m.test(content)) continue;

    const relative = file.replace(`${process.cwd()}/`, '');
    const lines = content.split(/\r?\n/);
    let found = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('uses: ./.github/workflows/ops-artifacts-verify.yml')) {
        found = true;
        const indentMatch = lines[i].match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';
        let hasIf = false;

        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].startsWith(indent)) {
            if (lines[j].trim().startsWith('if:')) {
              if (lines[j].includes(CONDITION)) hasIf = true;
              break;
            }
          } else if (lines[j].trim() !== '') {
            break;
          }
        }

        for (let j = i + 1; j < lines.length && !hasIf; j++) {
          if (lines[j].startsWith(indent)) {
            if (lines[j].trim().startsWith('if:')) {
              if (lines[j].includes(CONDITION)) hasIf = true;
              break;
            }
          } else if (lines[j].trim() !== '') {
            break;
          }
        }

        if (!hasIf) {
          missingIf.push(relative);
        }
      }
    }

    if (!found) missing.push(relative);
  }

  if (missing.length > 0 || missingIf.length > 0) {
    if (missing.length > 0) {
      console.error(`Missing ops-artifacts-verify job in: ${missing.join(', ')}`);
    }
    if (missingIf.length > 0) {
      console.error(
        `Missing 'if: ${CONDITION}' in ops-artifacts-verify job in: ${missingIf.join(', ')}`,
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
