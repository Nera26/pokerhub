import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';

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
}

describe('GameGateway outbound queue metrics', () => {
  let GameGateway: any;
  let depthMock: jest.Mock;
  let dropMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    depthMock = jest.fn();
    dropMock = jest.fn();

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
      createHistogram: jest.fn((name: string) => {
        if (name === 'ws_outbound_queue_depth') return { record: depthMock };
        return { record: jest.fn() };
      }),
      createCounter: jest.fn((name: string) => {
        if (name === 'ws_outbound_dropped_total') return { add: dropMock };
        return { add: jest.fn() };
      }),
      createObservableGauge: jest
        .fn()
        .mockReturnValue({ addCallback: jest.fn(), removeCallback: jest.fn() }),
    }));
    jest.doMock('@opentelemetry/api', () => ({
      metrics: { getMeter: getMeterMock },
      trace: {
        getTracer: () => ({
          startActiveSpan: (_n: string, fn: any) => fn({ setAttribute: () => {}, end: () => {} }),
        }),
      },
    }));

    ({ GameGateway } = require('../../src/game/game.gateway'));
  });

  afterEach(() => {
    delete process.env.GATEWAY_QUEUE_LIMIT;
  });

  it('drops frames and records queue depth when saturated', async () => {
    process.env.GATEWAY_QUEUE_LIMIT = '2';
    const rooms = new RoomManager();
    const gateway = new GameGateway(
      rooms,
      new DummyAnalytics() as any,
      new ClockService(),
      new DummyRepo() as any,
      new DummyRedis() as any,
    );

    try {
      const client: any = { id: 'c1', emit: jest.fn() };
      (gateway as any).enqueue(client, 'state', {});
      (gateway as any).enqueue(client, 'state', {});
      (gateway as any).enqueue(client, 'state', {});

      expect(depthMock).toHaveBeenNthCalledWith(1, 1, { socketId: 'c1' });
      expect(depthMock).toHaveBeenNthCalledWith(2, 2, { socketId: 'c1' });
      expect(dropMock).toHaveBeenCalledTimes(1);
    } finally {
      await rooms.onModuleDestroy();
    }
  });
});
