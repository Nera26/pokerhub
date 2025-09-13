import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';

export class DummyAnalytics {
  async recordGameEvent(): Promise<void> {}
}

export class DummyRedis {
  private counts = new Map<string, number>();

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
}

export class DummyRepo {
  async findOne() {
    return null;
  }
  async find() {
    return [];
  }
  async save() {}
}

export interface QueueScenarioOpts {
  queueLimit: number;
  globalLimit: number;
  alertThreshold?: number;
}

export function collectGauge(cb?: (r: any) => void) {
  const observe = jest.fn();
  cb?.({ observe });
  return observe;
}

export function createQueueScenario(opts: QueueScenarioOpts) {
  jest.resetModules();
  const { queueLimit, globalLimit, alertThreshold } = opts;
  process.env.GATEWAY_QUEUE_LIMIT = String(queueLimit);
  process.env.GATEWAY_GLOBAL_LIMIT = String(globalLimit);
  if (alertThreshold !== undefined) {
    process.env.WS_OUTBOUND_QUEUE_ALERT_THRESHOLD = String(alertThreshold);
  }

  let maxCb: ((r: any) => void) | undefined;
  let limitCb: ((r: any) => void) | undefined;
  let thresholdCb: ((r: any) => void) | undefined;
  let globalLimitCb: ((r: any) => void) | undefined;
  let globalCountCb: ((r: any) => void) | undefined;
  const dropCounter = jest.fn();

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

  const getMeterMock = jest.fn(() => ({
    createHistogram: jest.fn(() => ({ record: jest.fn() })),
    createCounter: jest.fn((name: string) => {
      if (name === 'ws_outbound_dropped_total') return { add: dropCounter };
      return { add: jest.fn() };
    }),
    createObservableGauge: jest.fn((name: string) => {
      const gauge = { addCallback: (cb: any) => {}, removeCallback: jest.fn() };
      switch (name) {
        case 'ws_outbound_queue_max':
          gauge.addCallback = (cb: any) => {
            maxCb = cb;
          };
          break;
        case 'ws_outbound_queue_limit':
          gauge.addCallback = (cb: any) => {
            limitCb = cb;
          };
          break;
        case 'ws_outbound_queue_threshold':
          gauge.addCallback = (cb: any) => {
            thresholdCb = cb;
          };
          break;
        case 'game_action_global_limit':
          gauge.addCallback = (cb: any) => {
            globalLimitCb = cb;
          };
          break;
        case 'game_action_global_count':
          gauge.addCallback = (cb: any) => {
            globalCountCb = cb;
          };
          break;
      }
      return gauge;
    }),
  }));
  jest.doMock('@opentelemetry/api', () => ({
    metrics: { getMeter: getMeterMock },
    trace: {
      getTracer: () => ({
        startActiveSpan: (_n: string, fn: any) =>
          fn({ setAttribute: () => {}, end: () => {} }),
      }),
    },
    SpanStatusCode: { ERROR: 2 },
  }));

  const { GameGateway } = require('../../src/game/game.gateway');

  const rooms = new RoomManager();
  const gateway = new GameGateway(
    rooms,
    new DummyAnalytics() as any,
    new ClockService(),
    new DummyRepo() as any,
    new DummyRepo() as any,
    new DummyRedis() as any,
  );

  return {
    gateway,
    rooms,
    callbacks: { maxCb, limitCb, thresholdCb, globalLimitCb, globalCountCb },
    dropCounter,
  };
}

