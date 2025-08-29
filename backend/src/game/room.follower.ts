import { parentPort, workerData } from 'worker_threads';
import Redis from 'ioredis';
import type { GameState } from './engine';

if (!parentPort) {
  throw new Error('Worker must be run as a worker thread');
}
const port = parentPort;

const opts = (workerData as any).redisOptions as any;
const redis: Redis | undefined = opts ? new Redis(opts) : undefined;
const diffChannel = `room:${workerData.tableId}:diffs`;
const ackChannel = `room:${workerData.tableId}:snapshotAck`;

let log: Array<[number, GameState]> = [];
let current: GameState | undefined;

if (redis) {
  void redis.subscribe(diffChannel);
  redis.on('message', (_channel, msg) => {
    const [idx, state] = JSON.parse(msg) as [number, GameState];
    log[idx] = [idx, state];
    current = state;
    port.postMessage({ event: 'state', state });
  });
}

port.on('message', (msg: any) => {
  switch (msg.type) {
    case 'snapshot': {
      log = (msg.states as Array<[number, GameState]>) ?? [];
      current = log[log.length - 1]?.[1];
      void redis?.publish(ackChannel, String(log.length));
      port.postMessage({ seq: msg.seq, ok: true });
      break;
    }
    case 'getState':
      port.postMessage({ seq: msg.seq, state: current });
      break;
    case 'resume': {
      const from = msg.from ?? 0;
      port.postMessage({ seq: msg.seq, states: log.filter(([i]) => i >= from) });
      break;
    }
    case 'replay':
      port.postMessage({ seq: msg.seq, state: current });
      break;
    case 'ping':
      port.postMessage({ seq: msg.seq, ok: true });
      break;
  }
});
