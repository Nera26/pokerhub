import { GameEngine, InternalGameState, GameAction } from '../backend/src/game/engine';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

interface Options {
  hands: number;
  players: number;
  startingStack: number;
}

interface Level {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationMinutes: number;
}

interface Structure {
  levels: Level[];
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Record<string, number> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    opts[key] = Number(args[i + 1]);
  }
  return {
    hands: opts.hands || 100,
    players: opts.players || 9,
    startingStack: opts.startingStack || 1000,
  };
}

function loadStructures(): Record<string, Structure> {
  const dir = path.join(__dirname, '..', 'backend', 'src', 'tournament', 'structures');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const res: Record<string, Structure> = {};
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    res[file] = JSON.parse(raw) as Structure;
  }
  return res;
}

function loadBenchmarks(): Record<string, number> {
  const md = fs.readFileSync(path.join(__dirname, '..', 'docs', 'kpi-benchmarks.md'), 'utf8');
  const lines = md.split('\n');
  const metrics: Record<string, number> = {};
  const regex = /\*\*([^*]+)\*\*:.*<\s*(\d+)/; // captures name and numeric threshold
  for (const line of lines) {
    const m = line.match(regex);
    if (m) {
      metrics[m[1].trim()] = Number(m[2]);
    }
  }
  return metrics;
}

function nextBettingRound(engine: GameEngine, state: InternalGameState): InternalGameState {
  if (state.phase === 'DEAL') {
    state = engine.applyAction({ type: 'next' });
  }
  return state;
}

function randomAction(state: InternalGameState, playerId: string, bigBlind: number): GameAction {
  const player = state.players.find((p) => p.id === playerId);
  const toCall = state.currentBet - (player?.bet ?? 0);
  if (toCall > 0) {
    return Math.random() < 0.5
      ? { type: 'fold', playerId }
      : { type: 'call', playerId };
  }
  if (Math.random() < 0.5) {
    return { type: 'check', playerId };
  }
  const amount = Math.min(bigBlind, player?.stack ?? 0);
  return { type: 'bet', playerId, amount };
}

async function simulateLevel(level: Level, opts: Options): Promise<{ avgHandMs: number; ev: number[] }> {
  const ids = Array.from({ length: opts.players }, (_, i) => `p${i + 1}`);
  const durations: number[] = [];
  const ev = Array(opts.players).fill(0);

  for (let h = 0; h < opts.hands; h++) {
    const engine = await GameEngine.create(ids, {
      startingStack: opts.startingStack,
      smallBlind: level.smallBlind,
      bigBlind: level.bigBlind,
    });

    let state = engine.getState();
    const start = performance.now();

    engine.applyAction({ type: 'postBlind', playerId: ids[0], amount: level.smallBlind });
    engine.applyAction({ type: 'postBlind', playerId: ids[1], amount: level.bigBlind });

    state = engine.applyAction({ type: 'next' });

    let idx = 2;
    while (state.phase !== 'SETTLE') {
      const player = ids[idx % ids.length];
      const pState = state.players.find((p) => p.id === player);
      if (pState && !pState.folded && pState.stack > 0) {
        state = engine.applyAction(randomAction(state, player, level.bigBlind));
      }
      idx++;
      if (idx % ids.length === 0) {
        state = nextBettingRound(engine, state);
        if (state.phase === 'BETTING_ROUND' && state.currentBet === 0) {
          state = engine.applyAction({ type: 'next' });
        }
      }
    }

    const end = performance.now();
    durations.push(end - start);
    const finalStacks = engine.getState().players.map((p) => p.stack);
    for (let i = 0; i < ev.length; i++) {
      ev[i] += finalStacks[i] - opts.startingStack;
    }
  }

  const avgHandMs = durations.reduce((a, b) => a + b, 0) / durations.length;
  const evPerHand = ev.map((v) => v / opts.hands);
  return { avgHandMs, ev: evPerHand };
}

async function simulateStructure(name: string, structure: Structure, opts: Options, benchmarks: Record<string, number>) {
  let totalHands = 0;
  let totalDuration = 0;
  let cumulativeEv = Array(opts.players).fill(0);

  for (const level of structure.levels) {
    const res = await simulateLevel(level, opts);
    totalDuration += res.avgHandMs * opts.hands;
    totalHands += opts.hands;
    cumulativeEv = cumulativeEv.map((v, i) => v + res.ev[i] * opts.hands);
  }

  const avgHandMs = totalDuration / totalHands;
  const evPerHand = cumulativeEv.map((v) => v / totalHands);
  const target = benchmarks['Action round-trip latency'];
  const meetsTarget = typeof target === 'number' ? avgHandMs <= target : undefined;
  return {
    structure: name,
    avgHandMs,
    target,
    meetsTarget,
    ev: evPerHand,
  };
}

async function main() {
  const opts = parseArgs();
  const structures = loadStructures();
  const benchmarks = loadBenchmarks();
  const summaries = [] as unknown[];

  for (const [name, structure] of Object.entries(structures)) {
    summaries.push(await simulateStructure(name, structure, opts, benchmarks));
  }

  console.log(JSON.stringify({ opts, summaries }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

