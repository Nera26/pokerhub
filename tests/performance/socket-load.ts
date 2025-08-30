import cluster from "cluster";
import os from "os";
import { io, Socket } from "socket.io-client";
import fs from "fs";
import { PerformanceObserver } from "perf_hooks";

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

interface Assignment {
  seed: number;
  tableId: number;
}

interface WorkerReport {
  latencies: number[];
  dropped: number;
  assignments: Assignment[];
  gc: { type: string; duration: number }[];
  memory: NodeJS.MemoryUsage;
}

const METRICS_DIR = "metrics";

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

  const LATENCY_MS = Number(process.env.LATENCY_MS || 200);
  const JITTER_MS = Number(process.env.JITTER_MS || 200);
  const PACKET_LOSS = Number(process.env.PACKET_LOSS || 0.05);

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
    const WS_URL = process.env.WS_URL || "ws://localhost:3001";
    const socket: Socket = io(WS_URL, { transports: ["websocket"], reconnection: true });
    socket.on("connect", () => {
      socket.emit("join", { tableId });
      let actions = 0;
      const ACTION_INTERVAL_MS = Number(process.env.ACTION_INTERVAL_MS || 3000);
      const ACTIONS_PER_CLIENT = Number(process.env.ACTIONS_PER_CLIENT || 20);
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
  const assignments: Assignment[] = process.env.ASSIGNMENTS
    ? JSON.parse(process.env.ASSIGNMENTS)
    : [];
  const rng = mulberry32(workerSeed);
  const latencies: number[] = [];
  const dropped = { count: 0 };
  const tasks: Promise<void>[] = [];
  const usedAssignments: Assignment[] = [];

  let sources: Assignment[];
  if (assignments.length > 0) {
    sources = assignments.slice(0, clients);
  } else {
    sources = [];
    for (let i = 0; i < clients; i++) {
      const seed = Math.floor(rng() * 0xffffffff);
      const tableId = Math.floor(mulberry32(seed)() * Number(process.env.TABLES));
      sources.push({ seed, tableId });
    }
  }

  for (const { seed, tableId } of sources) {
    const clientRng = mulberry32(seed);
    usedAssignments.push({ seed, tableId });
    tasks.push(simulateClient(tableId, latencies, dropped, clientRng));
  }

  const gcEvents: { type: string; duration: number }[] = [];
  const obs = new PerformanceObserver((items) => {
    items.getEntries().forEach((e: any) => {
      gcEvents.push({ type: e.kind, duration: e.duration });
    });
  });
  obs.observe({ entryTypes: ["gc"], buffered: true });

  await Promise.all(tasks);
  obs.disconnect();
  process.send?.({ latencies, dropped: dropped.count, assignments: usedAssignments, gc: gcEvents, memory: process.memoryUsage() } as WorkerReport);
  process.exit(0);
}

interface RunSeeds {
  runSeed: number;
  tables: number;
  sockets: number;
  workers: Array<{ seed: number; assignments: Assignment[] }>;
}

async function primaryMain(replay?: RunSeeds) {
  await setupToxiproxy();
  const TABLES = Math.min(Number(process.env.TABLES || 10000), 10000);
  const SOCKETS = Math.min(Number(process.env.SOCKETS || 100000), 100000);
  const runSeed = replay ? replay.runSeed : Number(process.env.SEED || Date.now());
  const runRng = mulberry32(runSeed);
  const workers = os.cpus().length;
  const clientsPerWorker = Math.ceil(SOCKETS / workers);
  const allLatencies: number[] = [];
  let droppedFrames = 0;
  const workerSeeds: number[] = [];
  const allAssignments: Array<Assignment[]> = [];
  const allGc: Array<{ type: string; duration: number }[]> = [];
  const allMemory: NodeJS.MemoryUsage[] = [];

  for (let i = 0; i < workers; i++) {
    const seed = replay ? replay.workers[i]?.seed ?? 0 : Math.floor(runRng() * 0xffffffff);
    workerSeeds.push(seed);
    const assignments = replay ? replay.workers[i]?.assignments ?? [] : [];
    const env: NodeJS.ProcessEnv = {
      CLIENTS: String(clientsPerWorker),
      WORKER_SEED: String(seed),
      TABLES: String(TABLES),
    };
    if (assignments.length > 0) env.ASSIGNMENTS = JSON.stringify(assignments);
    const worker = cluster.fork(env);
    const idx = i;
    worker.on("message", (msg: WorkerReport) => {
      if (msg.latencies) allLatencies.push(...msg.latencies);
      droppedFrames += msg.dropped;
      allAssignments[idx] = msg.assignments;
      allGc[idx] = msg.gc;
      allMemory[idx] = msg.memory;
    });
  }

  let exited = 0;
  cluster.on("exit", async () => {
    exited++;
    if (exited === workers) {
      fs.mkdirSync(METRICS_DIR, { recursive: true });
      const hist = recordHistogram(allLatencies);
      const seeds: RunSeeds = replay || {
        runSeed,
        tables: TABLES,
        sockets: SOCKETS,
        workers: workerSeeds.map((seed, idx) => ({ seed, assignments: allAssignments[idx] || [] })),
      };
      fs.writeFileSync(
        `${METRICS_DIR}/latency-hist.json`,
        JSON.stringify({ ...hist, droppedFrames }, null, 2),
      );
      fs.writeFileSync(`${METRICS_DIR}/seeds.json`, JSON.stringify(seeds, null, 2));
      fs.writeFileSync(
        `${METRICS_DIR}/memory-gc.json`,
        JSON.stringify({ gc: allGc.flat(), memory: allMemory }, null, 2),
      );
      console.log("Latency ms", hist, "dropped", droppedFrames);
      process.exit(0);
    }
  });
}

export async function runLoad(replayFile?: string) {
  if (cluster.isPrimary) {
    const replay = replayFile ? (JSON.parse(fs.readFileSync(replayFile, "utf8")) as RunSeeds) : undefined;
    await primaryMain(replay);
  } else {
    await workerMain();
  }
}

if (require.main === module) {
  const replayFile = process.env.REPLAY_FILE;
  runLoad(replayFile);
}

