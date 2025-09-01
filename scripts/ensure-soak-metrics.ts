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
  const missingMetrics: string[] = [];
  const CONDITION = '${{ always() }}';

  for (const file of files) {
    if (file.endsWith('soak-metrics.yml') || file.endsWith('soak.yml')) continue;
    const content = readFileSync(file, 'utf-8');
    if (!/^\s*(?:['"])?on(?:['"])?\s*:/m.test(content)) continue;

    const relative = file.replace(`${process.cwd()}/`, '');
    const lines = content.split(/\r?\n/);

    // Track missing if conditions
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

    // Track soak jobs and ensure downstream soak-metrics
    interface JobInfo {
      name: string;
      usesSoak: boolean;
      usesMetrics: boolean;
      needs: string[];
    }

    const jobs: JobInfo[] = [];
    let inJobs = false;
    let current: JobInfo | null = null;
    let expectingNeeds = false;

    for (const line of lines) {
      if (/^\s*jobs:\s*$/.test(line)) {
        inJobs = true;
        continue;
      }
      if (!inJobs) continue;

      const jobMatch = line.match(/^\s{2}([A-Za-z0-9_-]+):\s*$/);
      if (jobMatch) {
        if (current) jobs.push(current);
        current = { name: jobMatch[1], usesSoak: false, usesMetrics: false, needs: [] };
        expectingNeeds = false;
        continue;
      }

      if (!current) continue;

      const needsMatch = line.match(/^\s{4}needs:\s*(.*)$/);
      if (needsMatch) {
        const rest = needsMatch[1].trim();
        if (rest.startsWith('[') && rest.endsWith(']')) {
          const arr = rest.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
          current.needs.push(...arr);
        } else if (rest) {
          current.needs.push(rest);
        } else {
          expectingNeeds = true;
        }
        continue;
      }

      if (expectingNeeds) {
        const itemMatch = line.match(/^\s{6}-\s*(\S+)/);
        if (itemMatch) {
          current.needs.push(itemMatch[1]);
          continue;
        } else if (/^\s{4}\S/.test(line)) {
          expectingNeeds = false;
        } else {
          continue;
        }
      }

      const usesMatch = line.match(/^\s{4}uses:\s*(.*)$/);
      if (usesMatch) {
        const val = usesMatch[1];
        if (val.includes('soak-metrics.yml')) current.usesMetrics = true;
        else if (val.includes('soak.yml')) current.usesSoak = true;
      }
    }

    if (current) jobs.push(current);

    const soakJobs = jobs.filter((j) => j.usesSoak);
    const metricsJobs = jobs.filter((j) => j.usesMetrics);

    for (const sj of soakJobs) {
      const hasDownstream = metricsJobs.some((mj) => mj.needs.includes(sj.name));
      if (!hasDownstream) missingMetrics.push(`${relative}:${sj.name}`);
    }
  }

  if (missingIf.length > 0 || missingMetrics.length > 0) {
    if (missingIf.length > 0) {
      console.error(`Missing 'if: ${CONDITION}' in soak jobs:`);
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
