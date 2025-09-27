import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomManager } from './room.service';
import {
  metrics,
  type Attributes,
  type ObservableResult,
} from '@opentelemetry/api';
import { loadPQueue, type PQueueInstance } from './pqueue-loader';
import type { InternalGameState } from './engine';
import type { GameState } from '@shared/types';
import { sanitize } from './state-sanitize';
import {
  addSample,
  percentile,
  recordTimestamp,
  createObservableGaugeSafe,
} from './metrics.util';

@WebSocketGateway({ namespace: 'spectate' })
export class SpectatorGateway
  implements OnGatewayConnection, OnGatewayDisconnect

{
  @WebSocketServer()
  server!: Server;
  private static readonly meter = metrics.getMeter('game');
  private static readonly droppedFrames = SpectatorGateway.meter.createCounter(
    'spectator_frames_dropped_total',
    { description: 'Number of spectator frames dropped' },
  );
  private static readonly rateLimitHits = SpectatorGateway.meter.createCounter(
    'spectator_rate_limit_hits_total',
    { description: 'Number of spectator rate limit hits' },
  );

  private static readonly outboundQueueDepthGauge = createObservableGaugeSafe(
    SpectatorGateway.meter,
    'ws_outbound_queue_depth',
    {
      description: 'Current depth of outbound WebSocket message queue',
      unit: 'messages',
    },
  );

  private static readonly outboundQueueUtilization = createObservableGaugeSafe(
    SpectatorGateway.meter,
    'ws_outbound_queue_utilization',
    {
      description: 'Outbound WebSocket queue depth as a fraction of limit',
    },
  );

  private static readonly outboundQueueDepthHistogram =
    SpectatorGateway.meter.createHistogram(
      'ws_outbound_queue_depth_samples',
      {
        description: 'Depth of outbound WebSocket message queue',
        unit: 'messages',
      },
    );

  private static readonly outboundQueueMax = createObservableGaugeSafe(
    SpectatorGateway.meter,
    'ws_outbound_queue_max',
    {
      description: 'Maximum outbound WebSocket queue depth per socket',
      unit: 'messages',
    },
  );

  private static readonly outboundQueueDropped =
    SpectatorGateway.meter.createCounter('ws_outbound_dropped_total', {
      description: 'Messages dropped due to full outbound queue',
    });

  private static readonly stateLatency = SpectatorGateway.meter.createHistogram(
    'spectator_state_latency_ms',
    {
      description: 'Latency from enqueue to spectator state emit',
      unit: 'ms',
    },
  );
  private static readonly throughputHist =
    SpectatorGateway.meter.createHistogram('spectator_throughput_ps', {
      description: 'Spectator frames processed per second',
      unit: 'frames/s',
    });

  private static readonly latencySamples: number[] = [];
  private static readonly frameTimestamps: number[] = [];
  private static readonly throughputSamples: number[] = [];
  private static readonly MAX_SAMPLES = 1000;

  private static readonly latencyP50 = createObservableGaugeSafe(
    SpectatorGateway.meter,
    'spectator_state_latency_p50_ms',
    { description: 'p50 spectator state latency', unit: 'ms' },
  );
  private static readonly latencyP95 = createObservableGaugeSafe(
    SpectatorGateway.meter,
    'spectator_state_latency_p95_ms',
    { description: 'p95 spectator state latency', unit: 'ms' },
  );
  private static readonly latencyP99 = createObservableGaugeSafe(
    SpectatorGateway.meter,
    'spectator_state_latency_p99_ms',
    { description: 'p99 spectator state latency', unit: 'ms' },
  );
  private static readonly throughputGauge = createObservableGaugeSafe(
    SpectatorGateway.meter,
    'spectator_throughput',
    {
      description: 'Spectator frames processed per second',
      unit: 'frames/s',
    },
  );
  private static readonly throughputP50 = createObservableGaugeSafe(
    SpectatorGateway.meter,
    'spectator_throughput_p50',
    { description: 'p50 spectator throughput', unit: 'frames/s' },
  );
  private static readonly throughputP95 = createObservableGaugeSafe(
    SpectatorGateway.meter,
    'spectator_throughput_p95',
    { description: 'p95 spectator throughput', unit: 'frames/s' },
  );
  private static readonly throughputP99 = createObservableGaugeSafe(
    SpectatorGateway.meter,
    'spectator_throughput_p99',
    { description: 'p99 spectator throughput', unit: 'frames/s' },
  );

  static {
    SpectatorGateway.latencyP50.addCallback((r) =>
      r.observe(percentile(SpectatorGateway.latencySamples, 50)),
    );
    SpectatorGateway.latencyP95.addCallback((r) =>
      r.observe(percentile(SpectatorGateway.latencySamples, 95)),
    );
    SpectatorGateway.latencyP99.addCallback((r) =>
      r.observe(percentile(SpectatorGateway.latencySamples, 99)),
    );
    SpectatorGateway.throughputGauge.addCallback((r) => {
      const now = Date.now();
      const cutoff = now - 1000;
      while (
        SpectatorGateway.frameTimestamps.length &&
        SpectatorGateway.frameTimestamps[0] < cutoff
      ) {
        SpectatorGateway.frameTimestamps.shift();
      }
      const fps = SpectatorGateway.frameTimestamps.length;
      r.observe(fps);
      SpectatorGateway.throughputHist.record(fps);
      addSample(
        SpectatorGateway.throughputSamples,
        fps,
        SpectatorGateway.MAX_SAMPLES,
      );
    });
    SpectatorGateway.throughputP50.addCallback((r) =>
      r.observe(percentile(SpectatorGateway.throughputSamples, 50)),
    );
    SpectatorGateway.throughputP95.addCallback((r) =>
      r.observe(percentile(SpectatorGateway.throughputSamples, 95)),
    );
    SpectatorGateway.throughputP99.addCallback((r) =>
      r.observe(percentile(SpectatorGateway.throughputSamples, 99)),
    );
  }

  private readonly queues = new Map<string, PQueueInstance>();
  private readonly queuePromises = new Map<string, Promise<PQueueInstance>>();
  private readonly maxQueueSizes = new Map<string, number>();
  private readonly queueLimit = Number(
    process.env.SPECTATOR_QUEUE_LIMIT ?? '100',
  );
  private readonly intervalCap = Number(
    process.env.SPECTATOR_RATE_LIMIT ?? '30',
  );
  private readonly interval = Number(
    process.env.SPECTATOR_INTERVAL_MS ?? '10000',
  );

  private readonly observeQueueDepth = (result: ObservableResult) => {
    for (const [socketId, queue] of this.queues) {
      result.observe(queue.size + queue.pending, { socketId } as Attributes);
    }
  };

  private readonly observeQueueUtilization = (result: ObservableResult) => {
    for (const [socketId, queue] of this.queues) {
      result.observe(
        (queue.size + queue.pending) / this.queueLimit,
        { socketId } as Attributes,
      );
    }
  };

  private readonly observeQueueMax = (result: ObservableResult) => {
    for (const [socketId, max] of this.maxQueueSizes) {
      result.observe(max, { socketId } as Attributes);
      this.maxQueueSizes.set(socketId, 0);
    }
  };

  constructor(private readonly rooms: RoomManager) {
    SpectatorGateway.outboundQueueMax.addCallback(this.observeQueueMax);
    SpectatorGateway.outboundQueueDepthGauge.addCallback(
      this.observeQueueDepth,
    );
    SpectatorGateway.outboundQueueUtilization.addCallback(
      this.observeQueueUtilization,
    );
  }

  async handleConnection(client: Socket) {
    const tableId = (client.handshake.query.tableId as string) || 'default';
    const room = this.rooms.get(tableId);
    void client.join(tableId);

    const state = (await room.getPublicState()) as InternalGameState;
    await this.enqueue(client, 'state', sanitize(state));

    const listener = (s: InternalGameState) => {
      const safe = sanitize(s);
      if (client.connected) {
        void this.enqueue(client, 'state', safe);
      } else {
        SpectatorGateway.droppedFrames.add(1, { reason: 'disconnect' });
      }
    };

    room.on('state', listener);
    client.on('disconnect', () => room.off('state', listener));
  }

  handleDisconnect(client: Socket) {
    this.queues.get(client.id)?.clear();
    this.queues.delete(client.id);
    this.queuePromises.delete(client.id);
    this.maxQueueSizes.delete(client.id);
  }

  private async enqueue(
    client: Socket,
    event: string,
    payload: unknown,
  ): Promise<void> {
    const id = client.id;
    let queue = this.queues.get(id);
    if (!queue) {
      let creation = this.queuePromises.get(id);
      if (!creation) {
        creation = (async () => {
          const PQueueCtor = await loadPQueue();
          const created = new PQueueCtor({
            concurrency: 1,
            intervalCap: this.intervalCap,
            interval: this.interval,
          });
          this.queues.set(id, created);
          return created;
        })();
        this.queuePromises.set(id, creation);
      }
      try {
        queue = await creation;
      } finally {
        this.queuePromises.delete(id);
      }
    }
    if (!queue) return;
    if (queue.size + queue.pending >= this.queueLimit) {
      SpectatorGateway.rateLimitHits.add(1);
      SpectatorGateway.droppedFrames.add(1, { reason: 'rate_limit' });
      SpectatorGateway.outboundQueueDropped.add(1, { socketId: id } as Attributes);
      return;
    }
    const start = Date.now();
    void queue.add(() => {
      client.emit(event, payload as GameState);
      const latency = Date.now() - start;
      SpectatorGateway.stateLatency.record(latency, { socketId: id } as Attributes);
      addSample(
        SpectatorGateway.latencySamples,
        latency,
        SpectatorGateway.MAX_SAMPLES,
      );
      recordTimestamp(SpectatorGateway.frameTimestamps, Date.now());
    });
    const depth = queue.size + queue.pending;
    SpectatorGateway.outboundQueueDepthHistogram.record(depth, {
      socketId: id,
    } as Attributes);
    this.maxQueueSizes.set(
      id,
      Math.max(this.maxQueueSizes.get(id) ?? 0, depth),
    );
  }

}
