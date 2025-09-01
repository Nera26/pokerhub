import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';

jest.mock('p-queue', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    add: (fn: any) => Promise.resolve().then(fn),
    size: 0,
    pending: 0,
    clear: jest.fn(),
  })),
}));

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

describe('GameGateway rate limits', () => {
  let GameGateway: any;
  let perSocketMock: jest.Mock;
  let globalMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    perSocketMock = jest.fn();
    globalMock = jest.fn();
    const getMeterMock = jest.fn(() => ({
      createHistogram: jest.fn(() => ({ record: jest.fn() })),
      createCounter: jest.fn((name: string) => {
        if (name === 'per_socket_limit_exceeded') return { add: perSocketMock };
        if (name === 'global_limit_exceeded') return { add: globalMock };
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
    delete process.env.GATEWAY_GLOBAL_LIMIT;
  });

  it("doesn't throttle other clients", async () => {
    process.env.GATEWAY_GLOBAL_LIMIT = '1000';
    const rooms = new RoomManager();
    const gateway = new GameGateway(
      rooms,
      new DummyAnalytics() as any,
      new ClockService(),
      new DummyRepo() as any,
      new DummyRedis() as any,
    );

    try {
      const fast: any = { id: 'c1', emit: jest.fn() };
      const slow: any = { id: 'c2', emit: jest.fn() };

      for (let i = 0; i < 31; i++) {
        await gateway.handleJoin(fast, { actionId: `a${i}` });
      }
      await gateway.handleJoin(slow, { actionId: 'b1' });

      const fastErrors = fast.emit.mock.calls.filter(([ev]: any[]) => ev === 'server:Error');
      const slowErrors = slow.emit.mock.calls.filter(([ev]: any[]) => ev === 'server:Error');

      expect(fastErrors.length).toBe(1);
      expect(slowErrors.length).toBe(0);
      expect(perSocketMock).toHaveBeenCalledTimes(1);
      expect(globalMock).not.toHaveBeenCalled();
    } finally {
      await rooms.onModuleDestroy();
    }
  });

  it('throttles after exceeding global limit', async () => {
    process.env.GATEWAY_GLOBAL_LIMIT = '5';
    const rooms = new RoomManager();
    const gateway = new GameGateway(
      rooms,
      new DummyAnalytics() as any,
      new ClockService(),
      new DummyRepo() as any,
      new DummyRedis() as any,
    );

    try {
      const clients = Array.from({ length: 6 }, (_, i) => ({
        id: `c${i}`,
        emit: jest.fn(),
      } as any));

      for (let i = 0; i < 5; i++) {
        await gateway.handleJoin(clients[i], { actionId: `a${i}` });
      }
      await gateway.handleJoin(clients[5], { actionId: 'a5' });

      const errors = clients[5].emit.mock.calls.filter(([ev]: any[]) => ev === 'server:Error');
      expect(errors.length).toBe(1);
      expect(globalMock).toHaveBeenCalledTimes(1);
    } finally {
      await rooms.onModuleDestroy();
    }
  });
});
