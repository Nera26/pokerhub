import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';

class DummyAnalytics {
  async recordGameEvent(): Promise<void> {}
}

class DummyRedis {
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

class DummyRepo {
  async findOne() { return null; }
  async find() { return []; }
  async save() {}
}

describe('GameGateway queue saturation under load', () => {
  let GameGateway: any;
  let maxCb: ((r: any) => void) | undefined;
  let limitCb: ((r: any) => void) | undefined;
  let globalLimitCb: ((r: any) => void) | undefined;
  let globalCountCb: ((r: any) => void) | undefined;

  beforeEach(() => {
    jest.resetModules();

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
      createCounter: jest.fn(() => ({ add: jest.fn() })),
      createObservableGauge: jest.fn((name: string) => {
        const gauge = { addCallback: (cb: any) => {}, removeCallback: jest.fn() };
        switch (name) {
          case 'ws_outbound_queue_max':
            gauge.addCallback = (cb: any) => { maxCb = cb; };
            break;
          case 'ws_outbound_queue_limit':
            gauge.addCallback = (cb: any) => { limitCb = cb; };
            break;
          case 'game_action_global_limit':
            gauge.addCallback = (cb: any) => { globalLimitCb = cb; };
            break;
          case 'game_action_global_count':
            gauge.addCallback = (cb: any) => { globalCountCb = cb; };
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
    }));

    ({ GameGateway } = require('../../src/game/game.gateway'));
  });

  afterEach(() => {
    delete process.env.GATEWAY_QUEUE_LIMIT;
    delete process.env.GATEWAY_GLOBAL_LIMIT;
  });

  it('reports metrics staying below configured limits', async () => {
    process.env.GATEWAY_QUEUE_LIMIT = '5';
    process.env.GATEWAY_GLOBAL_LIMIT = '10';
    const rooms = new RoomManager();
    const gateway = new GameGateway(
      rooms,
      new DummyAnalytics() as any,
      new ClockService(),
      new DummyRepo() as any,
      new DummyRepo() as any,
      new DummyRedis() as any,
    );

    const client: any = {
      id: 'c1',
      emit: jest.fn(),
      handshake: { headers: {}, auth: {}, address: '1.1.1.1' },
      conn: { remoteAddress: '1.1.1.1' },
      data: {},
    };

    for (let i = 0; i < 4; i++) {
      (gateway as any).enqueue(client, 'state', {});
    }
    for (let i = 0; i < 9; i++) {
      await (gateway as any).isRateLimited(client);
    }

    const collect = (cb?: (r: any) => void) => {
      const observe = jest.fn();
      cb?.({ observe });
      return observe;
    };

    const maxObs = collect(maxCb);
    const limitObs = collect(limitCb);
    const globalLimitObs = collect(globalLimitCb);
    const globalCountObs = collect(globalCountCb);

    const maxVal = maxObs.mock.calls[0][0];
    const countVal = globalCountObs.mock.calls[0][0];

    expect(limitObs).toHaveBeenCalledWith(5);
    expect(globalLimitObs).toHaveBeenCalledWith(10);
    expect(maxVal).toBeLessThan(Number(process.env.GATEWAY_QUEUE_LIMIT));
    expect(countVal).toBeLessThan(Number(process.env.GATEWAY_GLOBAL_LIMIT));
  });
});
