import { mock } from 'node:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export function runScript(
  arg1: string,
  arg2?: string | ((dir: string) => void),
  arg3?: (dir: string) => void,
): void {
  let dir: string;
  let entry: string;
  let setup: ((dir: string) => void) | undefined;

  if (typeof arg2 === 'string') {
    dir = arg1;
    entry = arg2;
    setup = arg3;
  } else {
    entry = arg1;
    setup = arg2;
    dir = mkdtempSync(join(tmpdir(), 'wf-'));
  }

  if (setup) setup(dir);

  const cwd = process.cwd();
  process.chdir(dir);
  try {
    delete require.cache[entry];
    require(entry);
  } finally {
    process.chdir(cwd);
  }
}

export function mockExit() {
  return mock.method(process, 'exit', (code?: number) => {
    throw new Error(String(code));
  });
}

module.exports = { runScript, mockExit };
