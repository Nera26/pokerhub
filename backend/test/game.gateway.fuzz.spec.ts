import fc from 'fast-check';
import { metrics } from '@opentelemetry/api';
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

class DummyAnalytics {
  async recordGameEvent(): Promise<void> {}
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

class DummyRedis {
  private counts = new Map<string, number>();
  private hashes = new Map<string, string>();

  async incr(key: string) {
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
  }

  async expire(_key: string, _ttl: number) {
    return 1;
  }

  multi() {
    const self = this;
    return {
      incr(key1: string) {
        return {
          incr(key2: string) {
            return {
              exec: async () => {
                const a = await self.incr(key1);
                const b = await self.incr(key2);
                return [[null, a], [null, b]] as unknown;
              },
            };
          },
        };
      },
    } as any;
  }

  async hget(hash: string, field: string) {
    return this.hashes.get(`${hash}:${field}`) ?? null;
  }

  async hset(hash: string, field: string, value: string) {
    this.hashes.set(`${hash}:${field}`, value);
    return 1;
  }
}

function setupMetrics() {
  const exporter = new InMemoryMetricExporter(
    AggregationTemporality.CUMULATIVE,
  );
  const reader = new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: 60_000,
  });
  const provider = new MeterProvider();
  const providerWithRegistration = provider as MeterProvider & {
    addMetricReader?: (reader: PeriodicExportingMetricReader) => void;
    registerMetricReader?: (reader: PeriodicExportingMetricReader) => void;
  };
  if (typeof providerWithRegistration.addMetricReader === 'function') {
    providerWithRegistration.addMetricReader(reader);
  } else if (typeof providerWithRegistration.registerMetricReader === 'function') {
    providerWithRegistration.registerMetricReader(reader);
  } else {
    // Fallback for older SDKs where the reader list is internal.
    (provider as unknown as { metricReaders?: PeriodicExportingMetricReader[] }).metricReaders ??=
      [];
    (provider as unknown as { metricReaders: PeriodicExportingMetricReader[] }).metricReaders.push(
      reader,
    );
  }
  metrics.setGlobalMeterProvider(provider);
  return { exporter, provider };
}

function readCounter(exporter: InMemoryMetricExporter, name: string) {
  let sum = 0;
  for (const resourceMetric of exporter.getMetrics()) {
    for (const scopeMetric of resourceMetric.scopeMetrics ?? []) {
      for (const metric of scopeMetric.metrics ?? []) {
        if (metric.descriptor?.name !== name) {
          continue;
        }
        const dataPoints = Array.isArray(metric.dataPoints)
          ? metric.dataPoints
          : Array.from(metric.dataPoints ?? []);
        for (const point of dataPoints as Array<{ value?: number }>) {
          sum += Number(point.value ?? 0);
        }
      }
    }
  }
  return sum;
}

describe('GameGateway rate-limit fuzz', () => {
  it('tracks per-socket limit exceedances', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string(), { minLength: 31, maxLength: 60 }),
        async (ids) => {
          jest.resetModules();
          const { exporter, provider } = setupMetrics();
          const { GameGateway } = require('../src/game/game.gateway');
          const { RoomManager } = require('../src/game/room.service');
          const { ClockService } = require('../src/game/clock.service');
          const gateway = new GameGateway(
            new RoomManager() as any,
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
          };
          for (const id of ids) {
            await gateway.handleJoin(client, { actionId: id });
          }
          await provider.forceFlush();
          const count = readCounter(exporter, 'per_socket_limit_exceeded');
          expect(count).toBe(Math.max(0, ids.length - 30));
          await provider.shutdown();
        },
      ),
      { numRuns: 10 },
    );
  });

  it('tracks global limit exceedances', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string(), { minLength: 11, maxLength: 25 }),
        async (ids) => {
          process.env.GATEWAY_GLOBAL_LIMIT = '10';
          jest.resetModules();
          const { exporter, provider } = setupMetrics();
          const { GameGateway } = require('../src/game/game.gateway');
          const { RoomManager } = require('../src/game/room.service');
          const { ClockService } = require('../src/game/clock.service');
          const gateway = new GameGateway(
            new RoomManager() as any,
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
          };
          for (const id of ids) {
            await gateway.handleJoin(client, { actionId: id });
          }
          await provider.forceFlush();
          const global = readCounter(exporter, 'global_limit_exceeded');
          expect(global).toBe(Math.max(0, ids.length - 10));
          const per = readCounter(exporter, 'per_socket_limit_exceeded');
          expect(per).toBe(0);
          await provider.shutdown();
          delete process.env.GATEWAY_GLOBAL_LIMIT;
        },
      ),
      { numRuns: 10 },
    );
  });
});

