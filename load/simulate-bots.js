require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
});
const { GameEngine } = require('../backend/src/game/engine');
const { performance } = require('perf_hooks');
const fs = require('fs');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    opts[key] = Number(args[i + 1]);
  }
  return {
    hands: opts.hands || 1000,
    players: opts.players || 9,
    startingStack: opts.startingStack || 100,
    smallBlind: opts.smallBlind || 1,
    bigBlind: opts.bigBlind || 2,
  };
}

function loadStructure() {
  try {
    const md = fs.readFileSync('docs/tournament-handbook.md', 'utf8');
    const match = md.match(/```json\n([\s\S]*?)```/);
    if (!match) return null;
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function nextBettingRound(engine, state) {
  if (state.phase === 'DEAL') {
    state = engine.applyAction({ type: 'next' });
  }
  return state;
}

function randomAction(state, playerId, bigBlind) {
  const player = state.players.find((p) => p.id === playerId);
  const toCall = state.currentBet - player.bet;
  if (toCall > 0) {
    return Math.random() < 0.5
      ? { type: 'fold', playerId }
      : { type: 'call', playerId };
  }
  if (Math.random() < 0.5) {
    return { type: 'check', playerId };
  }
  const amount = Math.min(bigBlind, player.stack);
  return { type: 'bet', playerId, amount };
}

async function simulate(opts) {
  const ids = Array.from({ length: opts.players }, (_, i) => `p${i + 1}`);
  let stacks = Array(opts.players).fill(opts.startingStack);
  const durations = [];

  for (let h = 0; h < opts.hands; h++) {
    const engine = await GameEngine.create(ids, {
      startingStack: opts.startingStack,
      smallBlind: opts.smallBlind,
      bigBlind: opts.bigBlind,
    });

    let state = engine.getState();
    const start = performance.now();

    engine.applyAction({ type: 'postBlind', playerId: ids[0], amount: opts.smallBlind });
    engine.applyAction({ type: 'postBlind', playerId: ids[1], amount: opts.bigBlind });

    state = engine.applyAction({ type: 'next' });

    let idx = 2;
    while (state.phase !== 'SETTLE') {
      const player = ids[idx % ids.length];
      const pState = state.players.find((p) => p.id === player);
      if (pState && !pState.folded && pState.stack > 0) {
        state = engine.applyAction(randomAction(state, player, opts.bigBlind));
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
    stacks = engine.getState().players.map((p) => p.stack);
  }

  const avgHandMs = durations.reduce((a, b) => a + b, 0) / durations.length;
  return { avgHandMs, finalStacks: stacks };
}

async function main() {
  const opts = parseArgs();
  const structure = loadStructure();
  const res = await simulate(opts);
  const summary = {
    hands: opts.hands,
    players: opts.players,
    avgHandMs: res.avgHandMs,
    finalStacks: res.finalStacks,
    expectedDuration: structure && structure.expectedDuration,
  };
  console.log(JSON.stringify(summary));

  const dsn = process.env.CLICKHOUSE_DSN;
  if (dsn) {
    const sql = `INSERT INTO bot_simulation (ts, avg_hand_ms, hands, players) VALUES (now(), ${res.avgHandMs}, ${opts.hands}, ${opts.players})`;
    try {
      await fetch(`${dsn}/?query=${encodeURIComponent(sql)}`, { method: 'POST' });
    } catch (err) {
      console.error('ClickHouse insert failed', err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
