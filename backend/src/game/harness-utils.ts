import { io, Socket } from 'socket.io-client';
import { createHash } from 'crypto';
import { spawnSync } from 'child_process';
import { performance } from 'perf_hooks';
import type { GameAction } from '@shared/types';

/** Simple histogram to record latency percentiles. */
export class Histogram {
  private readonly values: number[] = [];

  record(v: number) {
    this.values.push(v);
  }

  /** Return percentile using nearest-rank. */
  percentile(p: number): number {
    if (this.values.length === 0) return 0;
    const sorted = [...this.values].sort((a, b) => a - b);
    const rank = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(rank, sorted.length - 1))];
  }

  count(): number {
    return this.values.length;
  }
}

export interface AckTracker {
  start: number;
  resolve: (ms: number) => void;
  timeout: NodeJS.Timeout;
}

export interface NetworkImpairmentOptions {
  packetLoss: number;
  latencyMs?: number;
  jitterMs?: number;
}

/** Configure toxiproxy with loss/latency/jitter. */
export function setupNetworkImpairment(opts: NetworkImpairmentOptions) {
  spawnSync('bash', ['-c', `./load/toxiproxy.sh`], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PACKET_LOSS: String(opts.packetLoss),
      ...(opts.latencyMs !== undefined
        ? { LATENCY_MS: String(opts.latencyMs) }
        : {}),
      ...(opts.jitterMs !== undefined
        ? { JITTER_MS: String(opts.jitterMs) }
        : {}),
    },
  });
}

export function createAction(tableId: string, playerId: string): GameAction {
  return {
    version: '1',
    tableId,
    playerId,
    type: 'fold',
  } as GameAction;
}

export interface SpawnBotOptions {
  id: number;
  tables: number;
  wsUrl: string;
  histogram: Histogram;
  trackers: Map<string, AckTracker>;
  onDropped: (tableId: string) => void;
  reconnect?: boolean;
}

/** Spawn a socket and perform one action measuring ACK latency. */
export function spawnBot({
  id,
  tables,
  wsUrl,
  histogram,
  trackers,
  onDropped,
  reconnect,
}: SpawnBotOptions) {
  const tableId = `table-${id % tables}`;
  const playerId = `player-${id}`;
  const socket: Socket = io(wsUrl, {
    transports: ['websocket'],
    query: { tableId, playerId },
  });

  if (reconnect) {
    socket.on('disconnect', () => {
      setTimeout(() => socket.connect(), 1000);
    });
  }

  socket.on('connect', () => {
    const action = createAction(tableId, playerId);
    const actionId = createHash('sha256')
      .update(JSON.stringify(action))
      .digest('hex');
    const start = performance.now();
    socket.emit('action', action);
    const ackHandler = (ack: { actionId: string }) => {
      const tracker = trackers.get(ack.actionId);
      if (tracker) {
        clearTimeout(tracker.timeout);
        tracker.resolve(performance.now() - tracker.start);
        trackers.delete(ack.actionId);
      }
    };
    socket.on('action:ack', ackHandler);
    const timeout = setTimeout(() => {
      onDropped(tableId);
      socket.off('action:ack', ackHandler);
    }, 1000);
    trackers.set(actionId, {
      start,
      resolve: (ms) => histogram.record(ms),
      timeout,
    });
  });
}

