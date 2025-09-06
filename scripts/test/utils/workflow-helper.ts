import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function runScript(script: string, setup: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'wf-'));
  setup(dir);
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    delete require.cache[script];
    require(script);
  } finally {
    process.chdir(cwd);
  }
}

module.exports = { runScript };
