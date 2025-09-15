import { readFileSync } from 'fs';

export function collectGcPauses(): number[] {
  const gcPauses: number[] = [];
  const origWrite = process.stderr.write.bind(process.stderr);
  (process.stderr as unknown as { write: typeof process.stderr.write }).write = (
    chunk: any,
    encoding?: any,
    cb?: any,
  ) => {
    const str = chunk.toString();
    const match = str.match(/\s(\d+(?:\.\d+)?) ms:/);
    if (match) {
      gcPauses.push(parseFloat(match[1]));
    }
    return origWrite(chunk, encoding, cb);
  };
  return gcPauses;
}

export type ReplayEngine = {
  applyAction(action: any): any;
  close?(): any;
};

export async function replayHandLogs(
  files: string[],
  engineFactory: (players: string[], file: string) => Promise<ReplayEngine> | ReplayEngine,
): Promise<void> {
  for (const file of files) {
    const lines = readFileSync(file, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean);
    if (lines.length === 0) continue;
    const first = JSON.parse(lines[0]);
    const players = (first[2]?.players ?? []).map((p: any) => p.id);
    const engine = await engineFactory(players, file);
    for (const line of lines) {
      const entry = JSON.parse(line);
      const action = entry[1];
      await engine.applyAction(action);
    }
    await engine.close?.();
  }
}

