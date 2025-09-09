import { parentPort, workerData } from 'worker_threads';
import Redis from 'ioredis';
import { metrics } from '@opentelemetry/api';
import { Logger } from '@nestjs/common';
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
const logger = new Logger('RoomWorker');

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
  // Default to enabled if flag keys are absent
  if (!pub) return true;
  const [global, room] = await Promise.all([
    pub.get('feature-flag:settlement'),
    pub.get(`feature-flag:room:${workerData.tableId}:settlement`),
  ]);
  const enabled = (v: string | null) => v === null || v === '1' || v === 'true';
  return enabled(global) && enabled(room);
}

async function isDealingEnabled(): Promise<boolean> {
  if (!pub) return true;
  const [global, room] = await Promise.all([
    pub.get('feature-flag:dealing'),
    pub.get(`feature-flag:room:${workerData.tableId}:dealing`),
  ]);
  const enabled = (v: string | null) => v === null || v === '1' || v === 'true';
  return enabled(global) && enabled(room);
}

async function resetToWaitBlinds(engine: GameEngine): Promise<void> {
  const st = engine.getState();
  st.phase = 'WAIT_BLINDS';
  st.deck = [];
  st.communityCards = [];
  for (const p of st.players) delete p.holeCards;
}

async function main() {
  const engine = await GameEngine.create(
    workerData.playerIds,
    { startingStack: 100, smallBlind: 1, bigBlind: 2 },
    undefined, // wallet
    undefined, // settlementSvc
    undefined, // handRepo
    undefined, // events
    workerData.tableId,
  );

  port.on(
    'message',
    async (msg: { type: string; seq: number; action?: GameAction; from?: number }) => {
      switch (msg.type) {
        case 'apply': {
          const beforePhase = engine.getState().phase;
          engine.applyAction(msg.action as GameAction);
          actionCounter.add(1, { tableId: workerData.tableId });

          let dealingHalted = false;
          if (beforePhase === 'WAIT_BLINDS' && engine.getState().phase === 'DEAL') {
            if (!(await isDealingEnabled())) {
              await resetToWaitBlinds(engine);
              dealingHalted = true;
            }
          }

          // Auto-advance dealing to reach a betting round or showdown
          while (engine.getState().phase === 'DEAL' && !dealingHalted) {
            if (!(await isDealingEnabled())) {
              await resetToWaitBlinds(engine);
              dealingHalted = true;
              break;
            }
            engine.applyAction({ type: 'next' });
            actionCounter.add(1, { tableId: workerData.tableId });
          }

          let idx = engine.getHandLog().slice(-1)[0]?.[0] ?? 0;
          let state = engine.getPublicState();

          // Settlement (gated by feature flags)
          const settlementEnabled = await isSettlementEnabled();
          let svc: SettlementService | undefined;
          if (settlementEnabled) {
            try {
              svc = await getSettlement();
              await svc.reserve(engine.getHandId(), state.street, idx);
            } catch (err) {
              logger.error(
                `Failed to reserve settlement (table: ${workerData.tableId}, hand: ${engine.getHandId()})`,
                err instanceof Error ? err.stack : undefined,
              );
            }
          }

          // Emit a full-state event for local consumers
          port.postMessage({ event: 'state', state });

          // Publish full state over Redis for socket fan-out
          await pub?.publish(diffChannel, JSON.stringify([idx, state]));

          if (dealingHalted) {
            port.postMessage({ event: 'dealingDisabled' });
          }

          if (state.phase === 'SETTLE') {
            engine.applyAction({ type: 'next' });
            actionCounter.add(1, { tableId: workerData.tableId });
            idx = engine.getHandLog().slice(-1)[0]?.[0] ?? idx;
            state = engine.getPublicState();
            port.postMessage({ event: 'state', state });
            await pub?.publish(diffChannel, JSON.stringify([idx, state]));
          }

          if (settlementEnabled && svc) {
            try {
              await svc.commit(engine.getHandId(), state.street, idx);
            } catch (err) {
              // Try to cancel if the service supports it
              try {
                const maybeCancel = (svc as unknown as { cancel?: Function }).cancel;
                if (typeof maybeCancel === 'function') {
                  await maybeCancel.call(svc, engine.getHandId(), state.street, idx);
                }
              } catch {
                // swallow cancel errors
              }
              logger.error(
                `Failed to commit settlement (table: ${workerData.tableId}, hand: ${engine.getHandId()})`,
                err instanceof Error ? err.stack : undefined,
              );
            }
          }

          // Respond directly to the requester with the final state
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
            .map(([index, , , post]) => [index, post] as [number, InternalGameState]);
          port.postMessage({ seq: msg.seq, states: log });
          break;
        }

        case 'snapshot': {
          const snap = engine
            .getHandLog()
            .map(([index, , , post]) => [index, post] as [number, InternalGameState]);
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
