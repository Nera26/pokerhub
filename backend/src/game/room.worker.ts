import { parentPort, workerData } from 'worker_threads';
import Redis from 'ioredis';
import { metrics } from '@opentelemetry/api';
import { GameAction, GameEngine, InternalGameState } from './engine';
import { AppDataSource } from '../database/data-source';
import { SettlementService } from '../wallet/settlement.service';
import { SettlementJournal } from '../wallet/settlement-journal.entity';
import { diff } from './state-diff';

if (!parentPort) {
  throw new Error('Worker must be run as a worker thread');
}
const port = parentPort;

const opts = (workerData as any).redisOptions as any;
const pub: Redis | undefined = opts ? new Redis(opts) : undefined;
const sub: Redis | undefined = opts ? new Redis(opts) : undefined;
const diffChannel = `room:${workerData.tableId}:diffs`;
const ackChannel = `room:${workerData.tableId}:snapshotAck`;

const meter = metrics.getMeter('game');
const actionCounter = meter.createCounter('actions_per_table_total', {
  description: 'Total game actions applied per table',
});

sub?.subscribe(ackChannel);
sub?.on('message', (channel, msg) => {
  if (channel === ackChannel) {
    port.postMessage({ event: 'snapshotAck', index: Number(msg) });
  }
});

let settlement: SettlementService;
let previousState: InternalGameState | undefined;

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

async function isSettlementEnabled(): Promise<boolean> {
  if (!pub) return true;
  const [global, room] = await Promise.all([
    pub.get('feature-flag:settlement'),
    pub.get(`feature-flag:room:${workerData.tableId}:settlement`),
  ]);
  const enabled = (v: string | null) =>
    v === null || v === '1' || v === 'true';
  return enabled(global) && enabled(room);
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
          actionCounter.add(1, { tableId: workerData.tableId });

          // Auto-advance dealing to reach a betting round or showdown
          while (engine.getState().phase === 'DEAL') {
            engine.applyAction({ type: 'next' });
            actionCounter.add(1, { tableId: workerData.tableId });
          }

          const idx = engine.getHandLog().slice(-1)[0]?.[0] ?? 0;
          const state = engine.getPublicState();

          const settlementEnabled = await isSettlementEnabled();
          let svc: SettlementService | undefined;
          if (settlementEnabled) {
            svc = await getSettlement();
            await svc.reserve(engine.getHandId(), state.street, idx);
          }

          const delta = diff(previousState, state);
          previousState = state;

          // Emit a full-state event for local consumers
          port.postMessage({ event: 'state', state });

          // Publish compact deltas over Redis for socket fan-out
          await pub?.publish(diffChannel, JSON.stringify([idx, delta]));

          if (settlementEnabled && svc) {
            await svc.commit(engine.getHandId(), state.street, idx);
          }

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
