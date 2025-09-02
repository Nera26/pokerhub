import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

class DummyAnalytics {
  async recordGameEvent(): Promise<void> {}
}

class DummyRedis {
  private counts = new Map<string, number>();
  private hashes = new Map<string, Map<string, string>>();

  multi() {
    const ops: string[] = [];
    const pipeline: any = {
      incr: (key: string) => {
        ops.push(key);
        return pipeline;
      },
      exec: async () =>
        ops.map((key) => {
          const next = (this.counts.get(key) ?? 0) + 1;
          this.counts.set(key, next);
          return [null, next];
        }),
    };
    return pipeline;
  }

  async incr(key: string) {
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }

  async expire(_key: string, _ttl: number) {
    return 1;
  }

  async hget(key: string, field: string) {
    return this.hashes.get(key)?.get(field) ?? null;
  }

  async hset(key: string, field: string, value: string) {
    const map = this.hashes.get(key) ?? new Map<string, string>();
    map.set(field, value);
    this.hashes.set(key, map);
    return 1;
  }
}

class DummyRepo {
  async findOne() {
    return null;
  }
  async find() {
    return [];
  }
  async save() {}
}

function setupMetrics() {
  const exporter = new InMemoryMetricExporter(
    AggregationTemporality.CUMULATIVE,
  );
  const reader = new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: 1000,
  });
  const provider = new MeterProvider({ readers: [reader] });
  return { exporter, provider };
}

function readCounter(exporter: InMemoryMetricExporter, name: string) {
  return exporter
    .getMetrics()
    .flatMap((r) => r.scopeMetrics)
    .flatMap((s) => s.metrics)
    .filter((m) => m.descriptor.name === name)
    .flatMap((m) => m.dataPoints)
    .reduce((sum, dp: any) => sum + Number(dp.value ?? 0), 0);
}

function readGauge(exporter: InMemoryMetricExporter, name: string) {
  return exporter
    .getMetrics()
    .flatMap((r) => r.scopeMetrics)
    .flatMap((s) => s.metrics)
    .filter((m) => m.descriptor.name === name)
    .flatMap((m) => m.dataPoints)
    .map((dp: any) => Number(dp.value ?? 0));
}

describe('GameGateway threshold monitoring', () => {
  it('keeps queue depth and global action rate under configured thresholds', async () => {
    process.env.WS_OUTBOUND_QUEUE_ALERT_THRESHOLD = '80';
    process.env.GATEWAY_GLOBAL_LIMIT = '100';
    const { exporter, provider } = setupMetrics();
    const { metrics } = require('@opentelemetry/api');
    metrics.setGlobalMeterProvider(provider);

    let size = 0;
    const pQueueMock = jest.fn().mockImplementation(() => ({
      add: jest.fn(() => {
        size++;
        return new Promise(() => {});
      }),
      get size() {
        return size;
      },
      get pending() {
        return 0;
      },
      clear: jest.fn(),
    }));
    jest.doMock('p-queue', () => ({ __esModule: true, default: pQueueMock }));

    let GameGateway: any;
    let RoomManager: any;
    let ClockService: any;
    let WS_OUTBOUND_QUEUE_ALERT_THRESHOLD: number;
    jest.isolateModules(() => {
      ({
        GameGateway,
        WS_OUTBOUND_QUEUE_ALERT_THRESHOLD,
      } = require('../../src/game/game.gateway'));
      ({ RoomManager } = require('../../src/game/room.service'));
      ({ ClockService } = require('../../src/game/clock.service'));
    });

    const gateway = new GameGateway(
      new RoomManager(),
      new DummyAnalytics() as any,
      new ClockService(),
      new DummyRepo() as any,
      new DummyRepo() as any,
      new DummyRedis() as any,
    );

    const client: any = {
      id: 'c1',
      handshake: { address: '1.1.1.1' },
      emit: jest.fn(),
      data: {},
    };

    for (let i = 0; i < 50; i++) {
      (gateway as any).enqueue(client, 'state', {});
    }
    for (let i = 0; i < 20; i++) {
      await gateway.handleJoin(client, { actionId: `a${i}` });
    }

    await provider.forceFlush();

    const depths = readGauge(exporter, 'ws_outbound_queue_depth');
    const maxDepth = Math.max(...depths);
    expect(maxDepth).toBeLessThanOrEqual(WS_OUTBOUND_QUEUE_ALERT_THRESHOLD);

    const globalExceeded = readCounter(exporter, 'global_limit_exceeded');
    expect(globalExceeded).toBe(0);

    await provider.shutdown();

    delete process.env.WS_OUTBOUND_QUEUE_ALERT_THRESHOLD;
    delete process.env.GATEWAY_GLOBAL_LIMIT;
  });
});
