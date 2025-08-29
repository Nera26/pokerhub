import cluster from "cluster";
import os from "os";
import { io, Socket } from "socket.io-client";
import fs from "fs";
import { createClient } from "@clickhouse/client";

interface Histogram {
  p50: number;
  p95: number;
  p99: number;
}

const WS_URL = process.env.WS_URL || "ws://localhost:3001";
const TABLES = Math.min(Number(process.env.TABLES || 10000), 10000);
const SOCKETS = Math.min(Number(process.env.SOCKETS || 80000), 80000);
const ACTION_INTERVAL_MS = Number(process.env.ACTION_INTERVAL_MS || 3000); // realistic ~3s action
const ACTIONS_PER_CLIENT = Number(process.env.ACTIONS_PER_CLIENT || 20);
const P95_THRESHOLD_MS = Number(process.env.P95_THRESHOLD_MS || 120);
const PACKET_LOSS = Number(process.env.PACKET_LOSS || 0.05);
const LATENCY_MS = Number(process.env.LATENCY_MS || 200);
const JITTER_MS = Number(process.env.JITTER_MS || 200);

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

async function setupToxiproxy() {
  const fetchFn: typeof fetch = (globalThis as any).fetch;
  const host = process.env.TOXIPROXY_URL || "http://localhost:8474";
  const name = process.env.TOXIPROXY_NAME || "pokerhub_ws";
  const listen = `0.0.0.0:${process.env.PROXY_PORT || "3001"}`;
  const upstream = process.env.UPSTREAM || "localhost:3000";

  // ensure clean slate
  await fetchFn(`${host}/proxies/${name}`, { method: "DELETE" }).catch(() => {});
  await fetchFn(`${host}/proxies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, listen, upstream }),
  });

  // remove existing toxics
  await fetchFn(`${host}/proxies/${name}/toxics/all`, { method: "DELETE" }).catch(() => {});

  // latency + jitter
  await fetchFn(`${host}/proxies/${name}/toxics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "latency",
      type: "latency",
      attributes: { latency: LATENCY_MS, jitter: JITTER_MS },
    }),
  });

  // packet loss
  await fetchFn(`${host}/proxies/${name}/toxics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "packet_loss",
      type: "timeout",
      attributes: { timeout: 1 },
      toxicity: PACKET_LOSS,
    }),
  });
}

async function simulateClient(
  tableId: number,
  latencies: number[],
  dropped: { count: number },
): Promise<void> {
  return new Promise((resolve) => {
    const socket: Socket = io(WS_URL, { transports: ["websocket"], reconnection: true });

    socket.on("connect", () => {
      socket.emit("join", { tableId });

      let actions = 0;
      const act = () => {
        const start = Date.now();
        socket
          .timeout(5000)
          .emit("action", { move: "check" }, (err: unknown) => {
            if (err) {
              dropped.count++;
            } else {
              latencies.push(Date.now() - start);
            }
            actions++;
            if (actions < ACTIONS_PER_CLIENT) {
              setTimeout(act, ACTION_INTERVAL_MS + Math.random() * ACTION_INTERVAL_MS);
            } else {
              socket.disconnect();
              resolve();
            }
          });
      };

      setTimeout(act, Math.random() * ACTION_INTERVAL_MS);
    });
  });
}

async function workerMain() {
  const clients = Number(process.env.CLIENTS || 1);
  const latencies: number[] = [];
  const dropped = { count: 0 };
  const tasks: Promise<void>[] = [];

  for (let i = 0; i < clients; i++) {
    const tableId = Math.floor(Math.random() * TABLES);
    tasks.push(simulateClient(tableId, latencies, dropped));
  }

  await Promise.all(tasks);
  process.send?.({ latencies, dropped: dropped.count });
  process.exit(0);
}

async function primaryMain() {
  await setupToxiproxy();
  const workers = os.cpus().length;
  const clientsPerWorker = Math.ceil(TOTAL_CLIENTS / workers);
  const allLatencies: number[] = [];
  let droppedFrames = 0;

  for (let i = 0; i < workers; i++) {
    const worker = cluster.fork({ CLIENTS: String(clientsPerWorker) });
    worker.on("message", (msg: any) => {
      if (msg.latencies) allLatencies.push(...msg.latencies);
      if (msg.dropped) droppedFrames += msg.dropped;
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
  cluster.on("exit", () => {
    exited++;
    if (exited === workers) {
      const hist = recordHistogram(allLatencies);
      const payload = { ...hist, droppedFrames };
      fs.writeFileSync("latency-hist.json", JSON.stringify(payload, null, 2));
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
