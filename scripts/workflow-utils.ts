import { readdirSync, Dirent, existsSync } from 'fs';
import { join } from 'path';

export function collectWorkflowDirs(dir: string): string[] {
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

export function collectYamlFiles(dir: string): string[] {
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
