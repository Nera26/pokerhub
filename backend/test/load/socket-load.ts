import cluster from "cluster";
import { createClient } from "@clickhouse/client";
import { Histogram, runPrimary, setupToxiproxy, workerMain } from "./shared/socket-harness";

if (cluster.isPrimary) {
  runPrimary({
    onStart: setupToxiproxy,
    onComplete: async ({ histogram, droppedFrames }) => {
      await exportToClickHouse(histogram, droppedFrames);
    },
  });
} else {
  void workerMain();
}

async function exportToClickHouse(hist: Histogram, dropped: number) {
  const url = process.env.CLICKHOUSE_URL;
  if (!url) return;
  const table = process.env.CLICKHOUSE_TABLE || "ws_ack_latency";
  const client = createClient({ url });
  await client.insert({
    table,
    values: [
      {
        ts: new Date().toISOString(),
        p50: hist.p50,
        p95: hist.p95,
        p99: hist.p99,
        dropped_frames: dropped,
      },
    ],
    format: "JSONEachRow",
  });
  await client.close();
}
