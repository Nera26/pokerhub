import { GameGateway } from '../../src/game/game.gateway';
import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';

class DummyAnalytics {
  async recordGameEvent(): Promise<void> {}
}

class DummyRedis {
  private counts = new Map<string, number>();
  private store = new Map<string, string>();
  async incr(key: string) {
    const next = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, next);
    return next;
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
}

class DummyRepo {
  async findOne() {
    return null;
  }
}

describe('GameGateway rate limits', () => {
  it("doesn't throttle other clients", async () => {
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

      const fastErrors = fast.emit.mock.calls.filter(
        ([ev]: any[]) => ev === 'server:Error',
      );
      const slowErrors = slow.emit.mock.calls.filter(
        ([ev]: any[]) => ev === 'server:Error',
      );

      expect(fastErrors.length).toBe(1);
      expect(slowErrors.length).toBe(0);
    } finally {
      await rooms.onModuleDestroy();
    }
  });
});

