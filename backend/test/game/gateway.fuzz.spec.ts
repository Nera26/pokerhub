import fc from 'fast-check';
import { ZodError } from 'zod';
import { ZodFastCheck } from 'zod-fast-check';
import { GameActionSchema } from '@shared/types';
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
  async incr() {
    return ++this.count;
  }
  async expire() {
    return 1;
  }
  async exists(key: string) {
    return this.store.has(key) ? 1 : 0;
  }
  async set(key: string, value: string, _mode: string, _ttl: number) {
    this.store.set(key, value);
    return 'OK';
  }
  multi() {
    const self = this;
    return {
      incr(key: string) {
        return {
          incr(key2: string) {
            return {
              exec: async () => {
                const a = await self.incr(key);
                const b = await self.incr(key2);
                return [[null, a], [null, b]] as unknown;
              },
            };
          },
        };
      },
    } as any;
  }
}

class DummyRepo {
  async findOne() {
    return null;
  }
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
          new DummyRedis() as any,
        );
        const client: any = { id: 'c1', emit: jest.fn() };

        await expect(
          gateway.handleAction(client, { ...payload, actionId: 'x' } as any),
        ).rejects.toBeInstanceOf(ZodError);

        await expect(
          gateway.handleAction(client, { ...payload, actionId: 'x' } as any),
        ).rejects.toBeInstanceOf(ZodError);
      }),
    );
  });

  it('rejects schema-derived malformed frames', async () => {
    const zfc = ZodFastCheck();
    const validAction = zfc.inputOf(GameActionSchema);
    await fc.assert(
      fc.asyncProperty(validAction, async (action) => {
        const gateway = new GameGateway(
          new RoomManager() as any,
          new DummyAnalytics() as any,
          new ClockService(),
          new DummyRepo() as any,
          new DummyRedis() as any,
        );
        const client: any = { id: 'c1', emit: jest.fn() };
        const malformed = { ...action, type: 'bogus' } as any;
        await expect(
          gateway.handleAction(client, { ...malformed, actionId: 'x' } as any),
        ).rejects.toBeInstanceOf(ZodError);
      }),
    );
  });

  it('processes out-of-order action frames gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string(), { minLength: 2, maxLength: 5 }),
        async (ids) => {
        const gateway = new GameGateway(
          new RoomManager() as any,
          new DummyAnalytics() as any,
          new ClockService(),
          new DummyRepo() as any,
          new DummyRedis() as any,
        );
        const client: any = { id: 'c1', emit: jest.fn() };
        const actions = ids.map(
          (id) => ({
            version: '1',
            type: 'next',
            tableId: 'default',
            actionId: id,
          } as any),
        );
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

  it('acknowledges replayed actionIds', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (id) => {
        const gateway = new GameGateway(
          new RoomManager() as any,
          new DummyAnalytics() as any,
          new ClockService(),
          new DummyRepo() as any,
          new DummyRedis() as any,
        );
        const client: any = { id: 'c1', emit: jest.fn() };
        const action = {
          version: '1',
          type: 'next',
          tableId: 'default',
          actionId: id,
        } as any;
        await gateway.handleAction(client, action);
        await gateway.handleAction(client, action);
        const acks = client.emit.mock.calls
          .filter(([ev]: any[]) => ev === 'action:ack')
          .map(([, data]: any[]) => data);
        expect(acks).toEqual([
          { actionId: id },
          { actionId: id, duplicate: true },
        ]);
      }),
    );
  });
});
