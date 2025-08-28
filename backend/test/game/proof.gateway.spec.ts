jest.mock('../../src/game/room.service', () => ({
  RoomManager: class {
    get() {
      return {
        apply: async () => ({}),
        getPublicState: async () => ({}),
        replay: async () => ({}),
      } as any;
    }
  },
}));
import { GameGateway } from '../../src/game/game.gateway';
import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';

class DummyAnalytics {
  async recordGameEvent(): Promise<void> {}
}

class DummyRedis {
  async incr() {
    return 1;
  }
  async expire() {
    return 1;
  }
}

describe('GameGateway proof', () => {
  it('emits proof for a settled hand', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue({
        commitment: 'c',
        seed: 's',
        nonce: 'n',
      }),
    };
    const gateway = new GameGateway(
      new RoomManager() as any,
      new DummyAnalytics() as any,
      new ClockService(),
      repo as any,
      new DummyRedis() as any,
    );
    const client: any = { id: 'c1', emit: jest.fn() };
    await gateway.handleProof(client, { handId: 'h1' });
    expect(client.emit).toHaveBeenCalledWith('proof', {
      commitment: 'c',
      seed: 's',
      nonce: 'n',
    });
  });
});
