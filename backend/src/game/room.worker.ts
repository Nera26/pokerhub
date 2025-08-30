import { parentPort, workerData } from 'worker_threads';
import Redis from 'ioredis';
import { GameAction, GameEngine, GameState } from './engine';
import { AppDataSource } from '../database/data-source';
import { SettlementService } from '../wallet/settlement.service';
import { SettlementJournal } from '../wallet/settlement-journal.entity';

if (!parentPort) {
  throw new Error('Worker must be run as a worker thread');
}
const port = parentPort;

const opts = (workerData as any).redisOptions as any;
const pub: Redis | undefined = opts ? new Redis(opts) : undefined;
const sub: Redis | undefined = opts ? new Redis(opts) : undefined;
const diffChannel = `room:${workerData.tableId}:diffs`;
const ackChannel = `room:${workerData.tableId}:snapshotAck`;
sub?.subscribe(ackChannel);
sub?.on('message', (channel, msg) => {
  if (channel === ackChannel) {
    port.postMessage({ event: 'snapshotAck', index: Number(msg) });
  }
});

let settlement: SettlementService;

async function getSettlement() {
  if (process.env.NODE_ENV === 'test') {
    return {
      reserve: async () => {},
      commit: async () => {},
    } as unknown as SettlementService;
  }
  if (!settlement) {
    const ds = await AppDataSource.initialize();
    settlement = new SettlementService(ds.getRepository(SettlementJournal));
  }
  return settlement;
}

async function main() {
  const engine = await GameEngine.create(
    workerData.playerIds,
    { startingStack: 100, smallBlind: 1, bigBlind: 2 },
    undefined,
    undefined,
    undefined,
    workerData.tableId,
  );

  port.on(
    'message',
    async (
      msg: { type: string; seq: number; action?: GameAction; from?: number },
    ) => {
      let state: GameState;
      switch (msg.type) {
        case 'apply':
          state = engine.applyAction(msg.action as GameAction);
          while (state.phase === 'DEAL') {
            state = engine.applyAction({ type: 'next' });
          }
          {
            const svc = await getSettlement();
            const idx = engine.getHandLog().slice(-1)[0]?.[0] ?? 0;
            await svc.reserve(engine.getHandId(), state.street, idx);
            port.postMessage({ event: 'state', state });
            await svc.commit(engine.getHandId(), state.street, idx);
            await pub?.publish(diffChannel, JSON.stringify([idx, state]));
          }
          port.postMessage({ seq: msg.seq, state });
          break;
        case 'getState':
          state = engine.getPublicState();
          port.postMessage({ seq: msg.seq, state });
          break;
        case 'replay':
          state = engine.replayHand();
          port.postMessage({ event: 'state', state });
          port.postMessage({ seq: msg.seq, state });
          break;
        case 'resume':
          const from = msg.from ?? 0;
          const log = engine
            .getHandLog()
            .filter(([index]) => index >= from)
            .map(([index, , , post]) => [index, post] as [number, GameState]);
          port.postMessage({ seq: msg.seq, states: log });
          break;
        case 'snapshot':
          const snap = engine
            .getHandLog()
            .map(([index, , , post]) => [index, post] as [number, GameState]);
          port.postMessage({ seq: msg.seq, states: snap });
          break;
        case 'ping':
          port.postMessage({ seq: msg.seq, ok: true });
          break;
      }
    },
  );
}

void main();
