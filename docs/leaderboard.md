# Leaderboard Rebuild

The leaderboard can be rebuilt from event logs stored under `storage/events/`.
Each file is named `YYYY-MM-DD.jsonl` and contains newline-delimited JSON
objects describing sessions. Generating a 30‑day dataset therefore requires 30
such files.

The CLI `rebuild.cli.ts` measures its own runtime and RSS memory usage, logging
both metrics when the rebuild completes. Use `--assert-duration=<ms>` to fail
the run if it takes too long.

## Command

```bash
npm --prefix backend install --legacy-peer-deps
TS_NODE_PROJECT=backend/tsconfig.json \
TS_NODE_TRANSPILE_ONLY=1 \
DATABASE_URL=postgres://localhost/test \
REDIS_URL=redis://localhost \
RABBITMQ_URL=amqp://localhost \
AWS_REGION=us-east-1 \
AWS_S3_BUCKET=bucket \
AWS_ACCESS_KEY_ID=key \
AWS_SECRET_ACCESS_KEY=secret \
JWT_SECRET=secret \
node -r ./backend/node_modules/ts-node/register \
     -r ./backend/node_modules/tsconfig-paths/register \
     backend/src/leaderboard/rebuild.cli.ts --assert-duration=1800000
```

The optional `--assert-duration` flag (milliseconds) causes the command to exit
non‑zero if the rebuild exceeds the target duration (30 minutes above).

## Expected hardware

A 5‑vCPU / 10 GiB RAM VM (Intel Xeon Platinum 8370C) processed a synthetic dataset
of ~6 000 events (200 per day for 30 days) in well under one second, leaving
ample headroom for much larger inputs while staying below the 30‑minute goal.

## Benchmark

To generate a fresh month of synthetic events and verify rebuild performance
against the incremental model, run:

```bash
npm run --workspace backend benchmark:leaderboard
```

This seeds 30 days of data (~6 000 sessions across 50 players) into
`storage/events/`, triggers a leaderboard rebuild, and logs runtime and memory
usage. The script fails if rebuilding takes longer than 30 minutes or if the
resulting leaderboard differs from the incremental calculation.
