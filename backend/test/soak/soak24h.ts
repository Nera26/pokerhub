import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

import { GameGateway } from '../../src/game/game.gateway';
import { ClockService } from '../../src/game/clock.service';
import { GameEngine } from '../../src/game/engine';

// Directory containing recorded hand logs
const logsDir = join(__dirname, '../../../storage/hand-logs');
const files = readdirSync(logsDir).filter((f) => f.endsWith('.jsonl'));
if (files.length === 0) {
  console.error('No hand logs found in', logsDir);
  process.exit(1);
}

// Capture GC pause durations from --trace-gc output
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

// Simple stubs for external dependencies
class DummyAnalytics {
  async recordGameEvent(): Promise<void> {}
}

class DummyRepo {
  async save(): Promise<void> {}
}

class DummyRedis {
  private counts = new Map<string, number>();
  private hashes = new Map<string, Map<string, string>>();
  async hget(key: string, field: string) {
    return this.hashes.get(key)?.get(field) ?? null;
  }
  async hset(key: string, field: string, value: string) {
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    this.hashes.get(key)!.set(field, value);
    return 1 as const;
  }
  async incr(key: string) {
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }
  async expire() {
    return 1 as const;
  }
  multi() {
    const self = this;
    return {
      incr(key: string) {
        return {
          incr(key2: string) {
            return {
              exec: async () => [
                [null, await self.incr(key)],
                [null, await self.incr(key2)],
              ],
            } as any;
          },
        } as any;
      },
    } as any;
  }
}

class InMemoryRoom {
  constructor(private readonly engine: GameEngine) {}
  async apply(action: any) {
    return this.engine.applyAction(action);
  }
  async getPublicState() {
    return this.engine.getPublicState();
  }
  async replay() {
    return this.engine.getPublicState();
  }
  async resume(_from: number) {
    return [] as Array<[number, unknown]>;
  }
}

class InMemoryRooms {
  private readonly rooms = new Map<string, InMemoryRoom>();
  async create(tableId: string, players: string[]) {
    const engine = await GameEngine.create(
      players,
      { startingStack: 100, smallBlind: 1, bigBlind: 2 },
      undefined,
      undefined,
      undefined,
      undefined,
      tableId,
    );
    this.rooms.set(tableId, new InMemoryRoom(engine));
  }
  get(tableId: string) {
    const room = this.rooms.get(tableId);
    if (!room) throw new Error(`Unknown table ${tableId}`);
    return room;
  }
  close(tableId: string) {
    this.rooms.delete(tableId);
  }
}

const startHeap = process.memoryUsage().heapUsed;
const endTime = Date.now() + 24 * 60 * 60 * 1000; // 24h
let nextLog = Date.now();

async function run() {
  const rooms = new InMemoryRooms();
  const gateway = new GameGateway(
    rooms as any,
    new DummyAnalytics() as any,
    new ClockService(),
    new DummyRepo() as any,
    new DummyRedis() as any,
  );

  const client: any = {
    id: 'c1',
    emit: () => {},
    handshake: { auth: {}, headers: {} },
  };

  while (Date.now() < endTime) {
    for (const file of files) {
      const lines = readFileSync(join(logsDir, file), 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean);
      if (lines.length === 0) continue;
      const first = JSON.parse(lines[0]);
      const players = (first[2]?.players ?? []).map((p: any) => p.id);
      const tableId = randomUUID();
      await rooms.create(tableId, players);

      for (const line of lines) {
        const entry = JSON.parse(line);
        const action = entry[1];
        await gateway.handleAction(client, {
          ...action,
          tableId,
          version: action.version ?? '1',
          actionId: randomUUID(),
        });

        if (Date.now() >= nextLog) {
          const heapMb = process.memoryUsage().heapUsed / 1024 / 1024;
          console.log(`Heap used: ${heapMb.toFixed(2)} MB`);
          nextLog = Date.now() + 60 * 1000; // log every minute
        }
      }

      rooms.close(tableId);
    }
  }

  const endHeap = process.memoryUsage().heapUsed;
  const growth = (endHeap - startHeap) / startHeap;

  gcPauses.sort((a, b) => a - b);
  const p95Index = Math.floor(gcPauses.length * 0.95);
  const p95 = gcPauses[p95Index] || 0;

  if (growth > 0.01) {
    console.error(`Memory growth ${(growth * 100).toFixed(2)}% exceeds 1%`);
    process.exit(1);
  }

  if (p95 > 50) {
    console.error(`GC pause p95 ${p95.toFixed(2)}ms exceeds 50ms`);
    process.exit(1);
  }

  console.log('Soak test passed: memory stable and GC pauses within limits');
}

run();

