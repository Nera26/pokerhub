import cluster from "cluster";
import os from "os";
import fs from "fs";
import { createClient } from "@clickhouse/client";
import { mulberry32, setupToxiproxy, simulateClient } from "../../../tests/performance/socket-utils";

interface Histogram {
  p50: number;
  p95: number;
  p99: number;
}

const TABLES = Math.min(Number(process.env.TABLES || 10000), 10000);
const SOCKETS = Math.min(Number(process.env.SOCKETS || 100000), 100000);
const P95_THRESHOLD_MS = Number(process.env.P95_THRESHOLD_MS || 120);

const RUN_SEED = Number(process.env.SEED || Date.now());
const runRng = mulberry32(RUN_SEED);

const TOTAL_CLIENTS = SOCKETS;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

function recordHistogram(latencies: number[]): Histogram {
  const sorted = [...latencies].sort((a, b) => a - b);
  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

async function workerMain() {
  const clients = Number(process.env.CLIENTS || 1);
  const workerSeed = Number(process.env.WORKER_SEED);
  const rng = mulberry32(workerSeed);
  const latencies: number[] = [];
  const dropped = { count: 0 };
  const tasks: Promise<void>[] = [];
  const assignments: Array<{ seed: number; tableId: number }> = [];

  for (let i = 0; i < clients; i++) {
    const seed = Math.floor(rng() * 0xffffffff);
    const clientRng = mulberry32(seed);
    const tableId = Math.floor(clientRng() * TABLES);
    assignments.push({ seed, tableId });
    tasks.push(simulateClient(tableId, latencies, dropped, clientRng));
  }

  await Promise.all(tasks);
  process.send?.({ latencies, dropped: dropped.count, assignments });
  process.exit(0);
}

async function primaryMain() {
  await setupToxiproxy();
  console.log(`run seed ${RUN_SEED}`);
  const workers = os.cpus().length;
  const clientsPerWorker = Math.ceil(TOTAL_CLIENTS / workers);
  const allLatencies: number[] = [];
  let droppedFrames = 0;
  const workerSeeds: number[] = [];
  const allAssignments: Array<Array<{ seed: number; tableId: number }>> = [];

  for (let i = 0; i < workers; i++) {
    const seed = Math.floor(runRng() * 0xffffffff);
    workerSeeds.push(seed);
    const worker = cluster.fork({ CLIENTS: String(clientsPerWorker), WORKER_SEED: String(seed) });
    const idx = i;
    worker.on("message", (msg: any) => {
      if (msg.latencies) allLatencies.push(...msg.latencies);
      if (msg.dropped) droppedFrames += msg.dropped;
      if (msg.assignments) allAssignments[idx] = msg.assignments;
    });
  }

  // randomly kill one worker to simulate process death
  setTimeout(() => {
    const ids = Object.keys(cluster.workers || {});
    if (ids.length > 0) {
      const victim = cluster.workers?.[ids[Math.floor(Math.random() * ids.length)]];
      victim?.kill();
    }
  }, 10000);

  let exited = 0;
  cluster.on("exit", async () => {
    exited++;
    if (exited === workers) {
      const hist = recordHistogram(allLatencies);
      const payload = { ...hist, droppedFrames };
      fs.writeFileSync("latency-hist.json", JSON.stringify(payload, null, 2));
      fs.writeFileSync(
        "seeds.json",
        JSON.stringify(
          {
            runSeed: RUN_SEED,
            tables: TABLES,
            sockets: SOCKETS,
            workers: workerSeeds.map((seed, idx) => ({
              seed,
              assignments: allAssignments[idx] || [],
            })),
          },
          null,
          2,
        ),
      );
      console.log("Latency ms", hist, "dropped", droppedFrames);
      await exportToClickHouse(hist, droppedFrames);
      if (hist.p95 > P95_THRESHOLD_MS) {
        console.error(`p95 ${hist.p95}ms exceeds ${P95_THRESHOLD_MS}ms`);
        process.exit(1);
      }
      process.exit(0);
    }
  });
}

if (cluster.isPrimary) {
  primaryMain();
} else {
  workerMain();
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
