import cluster from "cluster";
import os from "os";
import { io, Socket } from "socket.io-client";
import fs from "fs";

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Histogram {
  p50: number;
  p95: number;
  p99: number;
}

const WS_URL = process.env.WS_URL || "ws://localhost:3001";
const TABLES = Math.min(Number(process.env.TABLES || 10000), 10000);
const SOCKETS = Math.min(Number(process.env.SOCKETS || 100000), 100000);
const ACTION_INTERVAL_MS = Number(process.env.ACTION_INTERVAL_MS || 3000);
const ACTIONS_PER_CLIENT = Number(process.env.ACTIONS_PER_CLIENT || 20);
const P95_THRESHOLD_MS = Number(process.env.P95_THRESHOLD_MS || 120);
const PACKET_LOSS = Number(process.env.PACKET_LOSS || 0.05);
const LATENCY_MS = Number(process.env.LATENCY_MS || 200);
const JITTER_MS = Number(process.env.JITTER_MS || 200);

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

async function setupToxiproxy() {
  const fetchFn: typeof fetch = (globalThis as any).fetch;
  const host = process.env.TOXIPROXY_URL || "http://localhost:8474";
  const name = process.env.TOXIPROXY_NAME || "pokerhub_ws";
  const listen = `0.0.0.0:${process.env.PROXY_PORT || "3001"}`;
  const upstream = process.env.UPSTREAM || "localhost:3000";

  await fetchFn(`${host}/proxies/${name}`, { method: "DELETE" }).catch(() => {});
  await fetchFn(`${host}/proxies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, listen, upstream }),
  });

  await fetchFn(`${host}/proxies/${name}/toxics/all`, { method: "DELETE" }).catch(() => {});

  await fetchFn(`${host}/proxies/${name}/toxics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "latency",
      type: "latency",
      attributes: { latency: LATENCY_MS, jitter: JITTER_MS },
    }),
  });

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
  rng: () => number,
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
              setTimeout(act, ACTION_INTERVAL_MS + rng() * ACTION_INTERVAL_MS);
            } else {
              socket.disconnect();
              resolve();
            }
          });
      };

      setTimeout(act, rng() * ACTION_INTERVAL_MS);
    });
  });
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
      const mem = process.memoryUsage();
      fs.writeFileSync("memory-usage.json", JSON.stringify(mem, null, 2));
      if (typeof (global as any).gc === "function") {
        const before = process.memoryUsage();
        (global as any).gc();
        const after = process.memoryUsage();
        fs.writeFileSync("gc-usage.json", JSON.stringify({ before, after }, null, 2));
      }
      console.log("Latency ms", hist, "dropped", droppedFrames);
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

