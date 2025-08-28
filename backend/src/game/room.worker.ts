import { parentPort, workerData } from 'worker_threads';
import { GameAction, GameEngine, GameState } from './engine';

if (!parentPort) {
  throw new Error('Worker must be run as a worker thread');
}

const engine = new GameEngine(
  workerData.playerIds,
  undefined,
  undefined,
  undefined,
  workerData.tableId,
);

parentPort.on('message', (msg: { type: string; seq: number; action?: GameAction }) => {
  let state: GameState;
  switch (msg.type) {
    case 'apply':
      state = engine.applyAction(msg.action as GameAction);
      while (state.phase === 'DEAL') {
        state = engine.applyAction({ type: 'next' });
      }
      parentPort!.postMessage({ event: 'state', state });
      parentPort!.postMessage({ seq: msg.seq, state });
      break;
    case 'getState':
      state = engine.getPublicState();
      parentPort!.postMessage({ seq: msg.seq, state });
      break;
    case 'replay':
      state = engine.replayHand();
      parentPort!.postMessage({ event: 'state', state });
      parentPort!.postMessage({ seq: msg.seq, state });
      break;
  }
});
