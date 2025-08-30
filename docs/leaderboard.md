# Leaderboard Rebuild

The leaderboard can be rebuilt from event logs stored under `storage/events/`.
Each file is named `YYYY-MM-DD.jsonl` and contains newline-delimited JSON
objects describing sessions. Generating a 30‑day dataset therefore requires 30
such files.

The CLI `rebuild.ts` streams events from disk and rebuilds the read model while
recording total runtime and RSS memory usage. A warning is logged when a
30‑day rebuild exceeds 30 minutes. Use `--assert-duration=<ms>` to fail the run
if it takes too long. Passing `--benchmark` seeds synthetic events before
rebuilding.

## Command

```bash
npm --prefix backend install --legacy-peer-deps
TS_NODE_PROJECT=backend/tsconfig.json \\
TS_NODE_TRANSPILE_ONLY=1 \\
DATABASE_URL=postgres://localhost/test \\
REDIS_URL=redis://localhost \\
RABBITMQ_URL=amqp://localhost \\
GCP_PROJECT=my-project \\
GCS_BUCKET=bucket \\
GOOGLE_APPLICATION_CREDENTIALS=/path/to/creds.json \\
JWT_SECRET=secret \\
node -r ./backend/node_modules/ts-node/register \\
     -r ./backend/node_modules/tsconfig-paths/register \\
     backend/src/leaderboard/rebuild.ts --assert-duration=1800000
```

The optional `--assert-duration` flag (milliseconds) causes the command to exit
non‑zero if the rebuild exceeds the target duration (30 minutes above). When
`--benchmark` is provided and no threshold is supplied, the script defaults to
30 minutes.

## Expected hardware

A 5‑vCPU / 10 GiB RAM VM (Intel Xeon Platinum 8370C) processed a synthetic dataset
of ~6 000 events (200 per day for 30 days) in well under one second, leaving
ample headroom for much larger inputs while staying below the 30‑minute goal.

## Benchmark

To generate a fresh month of synthetic events and verify rebuild performance
against the incremental model, run:

```bash
npm run --workspace backend rebuild:leaderboard -- --benchmark
```

This seeds 30 days of data (~6 000 sessions across 50 players) into
`storage/events/`, triggers a leaderboard rebuild, and logs runtime and memory
usage. The script fails if rebuilding takes longer than 30 minutes (configurable
via `--assert-duration=<ms>`) or if the resulting leaderboard differs from the
incremental calculation.

The dataset size can be tuned with `--days`, `--players`, and `--sessions`
arguments to reduce runtime when experimenting locally or in CI.
