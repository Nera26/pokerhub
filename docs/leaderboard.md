# Leaderboard Rebuild

The leaderboard can be rebuilt from event logs stored under `storage/events/`.
Each file is named `YYYY-MM-DD.jsonl` and contains newline-delimited JSON
objects describing sessions. Generating a 30‑day dataset therefore requires 30
such files.

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
of ~3 000 events (100 per day for 30 days) in well under one second, leaving
ample headroom for much larger inputs while staying below the 30‑minute goal.
