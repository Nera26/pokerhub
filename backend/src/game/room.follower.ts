import { parentPort, workerData } from 'worker_threads';
import Redis from 'ioredis';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { GameState } from '@shared/types';

if (!parentPort) {
  throw new Error('Worker must be run as a worker thread');
}
const port = parentPort;

const opts = (workerData as any).redisOptions as any;
const redis: Redis | undefined = opts ? new Redis(opts) : undefined;
const diffChannel = `room:${workerData.tableId}:diffs`;
const ackChannel = `room:${workerData.tableId}:snapshotAck`;

const persistDir = resolve(__dirname, '../../..', 'storage', 'room-follower');
mkdirSync(persistDir, { recursive: true });
const persistFile = resolve(persistDir, `${workerData.tableId}.json`);

let log: Array<[number, GameState]> = [];
let current: GameState | undefined;

function loadPersisted(): void {
  try {
    const data = JSON.parse(readFileSync(persistFile, 'utf8')) as {
      log?: Array<[number, GameState]>;
      current?: GameState;
    };
    log = data.log ?? [];
    current = data.current;
  } catch {
    /* ignore */
  }
}

function persist(): void {
  try {
    writeFileSync(
      persistFile,
      JSON.stringify({ log, current }),
      'utf8',
    );
  } catch {
    /* ignore */
  }
}

loadPersisted();

/**
 * Deeply applies a delta onto the target. Objects are merged recursively.
 * Arrays and primitives replace the target at that key.
 */
function applyDelta(target: any, delta: any): any {
  if (!delta || typeof delta !== 'object') return delta;
  const result: any = Array.isArray(target) ? [...(target ?? [])] : { ...(target ?? {}) };
  for (const [key, value] of Object.entries(delta)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = applyDelta(result[key], value);
    } else {
      // primitives and arrays: replace
      result[key] = value as any;
    }
  }
  return result;
}

if (redis) {
  void redis.subscribe(diffChannel);
  redis.on('message', (_channel, msg) => {
    // Engine publishes [idx, delta]; apply onto current to produce the next state
    const [idx, delta] = JSON.parse(msg) as [number, Partial<GameState>];
    current = applyDelta(current, delta) as GameState;
    log[idx] = [idx, current as GameState];
    persist();
    port.postMessage({ event: 'state', state: current });
  });
}

port.on('message', (msg: any) => {
  switch (msg.type) {
    case 'snapshot': {
      // Full snapshot is an array of [index, state]
      log = (msg.states as Array<[number, GameState]>) ?? [];
      current = log[log.length - 1]?.[1];
      persist();
      void redis?.publish(ackChannel, String(log.length));
      port.postMessage({ seq: msg.seq, ok: true });
      break;
    }
    case 'getState': {
      port.postMessage({ seq: msg.seq, state: current });
      break;
    }
    case 'resume': {
      const from = msg.from ?? 0;
      port.postMessage({ seq: msg.seq, states: log.filter(([i]) => i >= from) });
      break;
    }
    case 'replay': {
      port.postMessage({ seq: msg.seq, state: current });
      break;
    }
    case 'ping': {
      port.postMessage({ seq: msg.seq, ok: true });
      break;
    }
  }
});
