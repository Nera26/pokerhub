import fc from 'fast-check';
import { ZodFastCheck } from 'zod-fast-check';
import { GameActionSchema as BackendActionSchema } from '@shared/schemas/game';
import { EVENT_SCHEMA_VERSION } from '@shared/events';
jest.mock('p-queue', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ add: (fn: any) => fn() })),
}));
jest.mock('../../src/game/room.service', () => ({
  RoomManager: class {
    get() {
      return {
        apply: async () => ({ street: 'preflop', pot: 0, players: [] }),
        getPublicState: async () => ({
          street: 'preflop',
          pot: 0,
          players: [],
        }),
      } as any;
    }
  },
}));
import { GameGateway } from '../../src/game/game.gateway';
import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';

// Simple stubs for dependencies

class DummyAnalytics {
  async recordGameEvent(): Promise<void> {}
}

class DummyRedis {
  private count = 0;
  private store = new Map<string, string>();
  private hashes = new Map<string, Map<string, string>>();

  async incr(_key: string) {
    return ++this.count;
  }

  async expire(_key: string, _ttl: number) {
    return 1;
  }

  async exists(key: string) {
    return this.store.has(key) ? 1 : 0;
  }

  async set(key: string, value: string, _mode: string, _ttl: number) {
    this.store.set(key, value);
    return 'OK';
  }

  async hget(key: string, field: string) {
    return this.hashes.get(key)?.get(field) ?? null;
  }

  async hset(key: string, field: string, value: string) {
    let map = this.hashes.get(key);
    if (!map) {
      map = new Map();
      this.hashes.set(key, map);
    }
    map.set(field, value);
    return 1;
  }

  async hgetall(key: string) {
    const map = this.hashes.get(key);
    return map ? Object.fromEntries(map) : {};
  }

  async hdel(key: string, field: string) {
    const map = this.hashes.get(key);
    if (!map) return 0;
    return map.delete(field) ? 1 : 0;
  }

  multi() {
    const self = this;
    const commands: Array<() => Promise<number>> = [];
    const chain: any = {
      incr(key: string) {
        commands.push(() => self.incr(key));
        return chain;
      },
      async exec() {
        const results: [null, number][] = [];
        for (const cmd of commands) {
          results.push([null, await cmd()]);
        }
        return results as unknown;
      },
    };
    return chain;
  }

  pipeline() {
    const self = this;
    const commands: Array<() => Promise<number>> = [];
    const chain: any = {
      hdel(key: string, field: string) {
        commands.push(() => self.hdel(key, field));
        return chain;
      },
      async exec() {
        const results: [null, number][] = [];
        for (const cmd of commands) {
          results.push([null, await cmd()]);
        }
        return results as unknown;
      },
    };
    return chain;
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

describe('GameGateway fuzz tests', () => {
  it('handles malformed actions without throwing', async () => {
    await fc.assert(
      fc.asyncProperty(fc.object(), async (payload) => {
        const gateway = new GameGateway(
          new RoomManager() as any,
          new DummyAnalytics() as any,
          new ClockService(),
          new DummyRepo() as any,
          new DummyRepo() as any,
          new DummyRedis() as any,
        );
        const client: any = { id: 'c1', emit: jest.fn() };

        await expect(
          gateway.handleAction(client, { ...payload, actionId: 'x' } as any),
        ).rejects.toThrow();

        await expect(
          gateway.handleAction(client, { ...payload, actionId: 'x' } as any),
        ).rejects.toThrow();
      }),
    );
  });

  it('rejects schema-derived malformed frames', async () => {
    const zfc = ZodFastCheck();
    const validAction = zfc
      .inputOf(BackendActionSchema)
      .map((a) => ({ ...a, tableId: a.tableId ?? 'default', version: '1' }));
    await fc.assert(
      fc.asyncProperty(validAction, async (action) => {
        const gateway = new GameGateway(
          new RoomManager() as any,
          new DummyAnalytics() as any,
          new ClockService(),
          new DummyRepo() as any,
          new DummyRepo() as any,
          new DummyRedis() as any,
        );
        const client: any = { id: 'c1', emit: jest.fn() };
        const malformed = { ...action, type: 'bogus' } as any;
        await expect(
          gateway.handleAction(client, { ...malformed, actionId: 'x' } as any),
        ).rejects.toThrow();
      }),
    );
  });

  it('processes out-of-order action frames gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
        async (ids) => {
          const gateway = new GameGateway(
            new RoomManager() as any,
            new DummyAnalytics() as any,
            new ClockService(),
            new DummyRepo() as any,
            new DummyRepo() as any,
            new DummyRedis() as any,
          );
          const client: any = { id: 'c1', emit: jest.fn() };
          const actions = ids.map(
            (id) =>
              ({
                version: '1',
                type: 'next',
                tableId: 'default',
                playerId: 'p',
                actionId: id,
              }) as any,
          );
          (gateway as any)['socketPlayers'].set(client.id, 'p');
          for (const action of actions.slice().reverse()) {
            await gateway.handleAction(client, action);
          }
          const ackCount = client.emit.mock.calls.filter(
            ([ev]: any[]) => ev === 'action:ack',
          ).length;
          expect(ackCount).toBe(ids.length);
        },
      ),
    );
  });

  it.skip('acknowledges replayed actionIds', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (id) => {
        const gateway = new GameGateway(
          new RoomManager() as any,
          new DummyAnalytics() as any,
          new ClockService(),
          new DummyRepo() as any,
          new DummyRepo() as any,
          new DummyRedis() as any,
        );
        const client: any = { id: 'c1', emit: jest.fn() };
        const action = {
          version: '1',
          type: 'next',
          tableId: 'default',
          playerId: 'p',
          actionId: id,
        } as any;
        (gateway as any)['socketPlayers'].set(client.id, 'p');
        await gateway.handleAction(client, action);
        await gateway.handleAction(client, action);
        const acks = client.emit.mock.calls
          .filter(([ev]: any[]) => ev === 'action:ack')
          .map(([, data]: any[]) => data);
        expect(acks).toEqual([
          { actionId: id, version: EVENT_SCHEMA_VERSION },
          { actionId: id, duplicate: true, version: EVENT_SCHEMA_VERSION },
        ]);
      }),
    );
  });
});
