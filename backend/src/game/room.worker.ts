import { parentPort, workerData } from 'worker_threads';
import { GameAction, GameEngine, GameState } from './engine';

if (!parentPort) {
  throw new Error('Worker must be run as a worker thread');
}
const port = parentPort;

async function main() {
  const engine = await GameEngine.create(
    workerData.playerIds,
    undefined,
    undefined,
    undefined,
    workerData.tableId,
  );

  port.on(
    'message',
    (msg: { type: string; seq: number; action?: GameAction; from?: number }) => {
      let state: GameState;
      switch (msg.type) {
        case 'apply':
          state = engine.applyAction(msg.action as GameAction);
          while (state.phase === 'DEAL') {
            state = engine.applyAction({ type: 'next' });
          }
          port.postMessage({ event: 'state', state });
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
      }
    },
  );
}

void main();
