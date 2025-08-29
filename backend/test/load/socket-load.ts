import cluster from "cluster";
import os from "os";
import { io, Socket } from "socket.io-client";
import fs from "fs";

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
      attributes: { latency: 200, jitter: 200 },
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
      toxicity: 0.05,
    }),
  });
}

async function simulateClient(tableId: number, latencies: number[]): Promise<void> {
  return new Promise((resolve) => {
    const socket: Socket = io(WS_URL, { transports: ["websocket"], reconnection: true });

    socket.on("connect", () => {
      socket.emit("join", { tableId });

      let actions = 0;
      const act = () => {
        const start = Date.now();
        socket.timeout(5000).emit("action", { move: "check" }, () => {
          latencies.push(Date.now() - start);
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
  const tasks: Promise<void>[] = [];

  for (let i = 0; i < clients; i++) {
    const tableId = Math.floor(Math.random() * TABLES);
    tasks.push(simulateClient(tableId, latencies));
  }

  await Promise.all(tasks);
  process.send?.({ latencies });
  process.exit(0);
}

async function primaryMain() {
  await setupToxiproxy();
  const workers = os.cpus().length;
  const clientsPerWorker = Math.ceil(TOTAL_CLIENTS / workers);
  const allLatencies: number[] = [];

  for (let i = 0; i < workers; i++) {
    const worker = cluster.fork({ CLIENTS: String(clientsPerWorker) });
    worker.on("message", (msg: any) => {
      if (msg.latencies) allLatencies.push(...msg.latencies);
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
      fs.writeFileSync("latency-hist.json", JSON.stringify(hist, null, 2));
      console.log("Latency ms", hist);
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
