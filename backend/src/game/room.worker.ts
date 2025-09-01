import { parentPort, workerData } from 'worker_threads';
import Redis from 'ioredis';
import { GameAction, GameEngine, InternalGameState } from './engine';
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
let previousState: InternalGameState | undefined;

function diff(prev: any, curr: any): Record<string, any> {
  if (!prev) return curr as Record<string, any>;
  const delta: Record<string, any> = {};
  for (const key of Object.keys(curr as Record<string, any>)) {
    const pv = (prev as any)[key];
    const cv = (curr as any)[key];
    if (pv && cv && typeof pv === 'object' && typeof cv === 'object') {
      const d = diff(pv, cv);
      if (Object.keys(d).length) delta[key] = d;
    } else if (pv !== cv) {
      delta[key] = cv;
    }
  }
  return delta;
}

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
    undefined, // wallet
    undefined, // handRepo
    undefined, // events
    workerData.tableId,
  );

  port.on(
    'message',
    async (
      msg: { type: string; seq: number; action?: GameAction; from?: number },
    ) => {
      switch (msg.type) {
        case 'apply': {
          engine.applyAction(msg.action as GameAction);

          // Auto-advance dealing to reach a betting round or showdown
          while (engine.getState().phase === 'DEAL') {
            engine.applyAction({ type: 'next' });
          }

          const svc = await getSettlement();
          const idx = engine.getHandLog().slice(-1)[0]?.[0] ?? 0;
          const state = engine.getPublicState();

          await svc.reserve(engine.getHandId(), state.street, idx);

          const delta = diff(previousState, state);
          previousState = state;

          // Emit a full-state event for local consumers
          port.postMessage({ event: 'state', state });

          // Publish compact deltas over Redis for socket fan-out
          await pub?.publish(diffChannel, JSON.stringify([idx, delta]));

          await svc.commit(engine.getHandId(), state.street, idx);

          // Respond directly to the requester with the full state
          port.postMessage({ seq: msg.seq, state });
          break;
        }

        case 'getState': {
          const state = engine.getPublicState();
          port.postMessage({ seq: msg.seq, state });
          break;
        }

        case 'replay': {
          engine.replayHand();
          const state = engine.getPublicState();
          port.postMessage({ event: 'state', state });
          port.postMessage({ seq: msg.seq, state });
          break;
        }

        case 'resume': {
          const from = msg.from ?? 0;
          const log = engine
            .getHandLog()
            .filter(([index]) => index >= from)
            .map(
              ([index, , , post]) =>
                [index, post] as [number, InternalGameState],
            );
          port.postMessage({ seq: msg.seq, states: log });
          break;
        }

        case 'snapshot': {
          const snap = engine
            .getHandLog()
            .map(
              ([index, , , post]) =>
                [index, post] as [number, InternalGameState],
            );
          port.postMessage({ seq: msg.seq, states: snap });
          break;
        }

        case 'ping': {
          port.postMessage({ seq: msg.seq, ok: true });
          break;
        }
      }
    },
  );
}

void main();
