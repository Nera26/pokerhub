import { io, Socket } from "socket.io-client";

export interface TableStat {
  latencies: number[];
  actions: number;
}

export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function setupToxiproxy() {
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

export async function simulateClient(
  tableId: number,
  latencies: number[],
  dropped: { count: number },
  rng: () => number,
  tableStats?: Record<number, TableStat>,
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
            const stat = tableStats ? (tableStats[tableId] ||= { latencies: [], actions: 0 }) : undefined;
            if (err) {
              dropped.count++;
            } else {
              const latency = Date.now() - start;
              latencies.push(latency);
              stat?.latencies.push(latency);
            }
            stat && stat.actions++;
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

