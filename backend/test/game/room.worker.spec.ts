import { EventEmitter } from 'events';

async function setup(flags: Record<string, string | null> = {}) {
  jest.resetModules();

  const port = new EventEmitter() as any;
  const messages: any[] = [];
  (port as any).postMessage = (msg: any) => {
    messages.push(msg);
  };

  const redisInstances: any[] = [];

  class MockRedis extends EventEmitter {
    options = {};
    publishes: Array<[string, string]> = [];
    subs: string[] = [];
    constructor() {
      super();
      redisInstances.push(this);
    }
    async publish(channel: string, message: string) {
      this.publishes.push([channel, message]);
      return 1;
    }
    async subscribe(channel: string) {
      this.subs.push(channel);
      return 1;
    }
    async get(key: string) {
      return flags[key] ?? null;
    }
  }

  const reserve = jest.fn(async () => {});
  const commit = jest.fn(async () => {});
  const cancel = jest.fn(async () => {});

  jest.doMock('worker_threads', () => ({
    parentPort: port,
    workerData: {
      tableId: 't',
      playerIds: ['p1', 'p2'],
      redisOptions: {},
    },
  }));

  jest.doMock('ioredis', () => MockRedis);

  jest.doMock('../../src/database/data-source', () => ({
    AppDataSource: {
      initialize: jest.fn().mockResolvedValue({ getRepository: jest.fn() }),
    },
  }));

  jest.doMock('../../src/wallet/settlement.service', () => ({
    SettlementService: jest.fn(() => ({ reserve, commit, cancel })),
  }));

  process.env.NODE_ENV = 'development';

  require('../../src/game/room.worker');

  await new Promise((res) => setImmediate(res));

  async function send(msg: any) {
    port.emit('message', msg);
    await new Promise((res) => setImmediate(res));
  }

  return { port, messages, redisInstances, reserve, commit, cancel, send };
}

describe('room.worker', () => {
  it('publishes diffs and handles snapshot ACK', async () => {
    const ctx = await setup();
    await ctx.send({
      type: 'apply',
      seq: 1,
      action: { type: 'postBlind', playerId: 'p1', amount: 1 },
    });

    const pub = ctx.redisInstances[0];
    expect(pub.publishes.length).toBe(1);
    const [channel, payload] = pub.publishes[0];
    expect(channel).toBe('room:t:diffs');
    const [idx, delta] = JSON.parse(payload);
    expect(typeof idx).toBe('number');
    expect(delta).toHaveProperty('players');

    const sub = ctx.redisInstances[1];
    sub.emit('message', sub.subs[0], '5');
    await new Promise((res) => setImmediate(res));
    expect(
      ctx.messages.find((m) => m.event === 'snapshotAck' && m.index === 5),
    ).toBeTruthy();
  });

  it('halts dealing when feature flag disabled', async () => {
    const ctx = await setup({ 'feature-flag:dealing': '0' });
    await ctx.send({
      type: 'apply',
      seq: 1,
      action: { type: 'postBlind', playerId: 'p1', amount: 1 },
    });
    await ctx.send({
      type: 'apply',
      seq: 2,
      action: { type: 'postBlind', playerId: 'p2', amount: 2 },
    });

    expect(
      ctx.messages.find((m) => m.event === 'dealingDisabled'),
    ).toBeTruthy();
    const state = ctx.messages.find((m) => m.seq === 2)?.state;
    expect(state.phase).toBe('WAIT_BLINDS');
  });

  it('skips settlement when feature flag disabled', async () => {
    const ctx = await setup({ 'feature-flag:settlement': '0' });
    await ctx.send({
      type: 'apply',
      seq: 1,
      action: { type: 'postBlind', playerId: 'p1', amount: 1 },
    });

    expect(ctx.reserve).not.toHaveBeenCalled();
    expect(ctx.commit).not.toHaveBeenCalled();
  });

  it('recovers after settlement commit failures', async () => {
    const ctx = await setup();
    ctx.commit.mockImplementationOnce(async () => {
      throw new Error('fail');
    });

    await ctx.send({
      type: 'apply',
      seq: 1,
      action: { type: 'postBlind', playerId: 'p1', amount: 1 },
    });
    expect(ctx.commit).toHaveBeenCalledTimes(1);
    expect(ctx.cancel).toHaveBeenCalledTimes(1);

    await ctx.send({
      type: 'apply',
      seq: 2,
      action: { type: 'postBlind', playerId: 'p2', amount: 2 },
    });
    expect(ctx.commit).toHaveBeenCalledTimes(2);
    const stateMsg = ctx.messages.find((m) => m.seq === 2);
    expect(stateMsg).toBeTruthy();
  });
});

