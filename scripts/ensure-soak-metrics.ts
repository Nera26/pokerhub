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
  const missingIf: string[] = [];
  const CONDITION = '${{ always() }}';

  for (const file of files) {
    if (file.endsWith('soak-metrics.yml') || file.endsWith('soak.yml')) continue;
    const content = readFileSync(file, 'utf-8');
    if (!/^\s*(?:['"])?on(?:['"])?\s*:/m.test(content)) continue;

    const relative = file.replace(`${process.cwd()}/`, '');
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('uses:') && (lines[i].includes('soak-metrics.yml') || lines[i].includes('soak.yml'))) {
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
          missingIf.push(`${relative}:${i + 1}`);
        }
      }
    }
  }

  if (missingIf.length > 0) {
    console.error(`Missing 'if: ${CONDITION}' in soak jobs:`);
    for (const file of missingIf) console.error(`  - ${file}`);
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
