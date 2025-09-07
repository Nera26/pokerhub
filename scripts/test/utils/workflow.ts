import { mock } from 'node:test';

export function runScript(dir: string, entry: string): void {
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
