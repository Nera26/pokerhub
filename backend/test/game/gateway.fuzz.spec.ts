import fc from 'fast-check';
import { GameGateway } from '../../src/game/game.gateway';
import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';

// Simple stubs for dependencies
class DummyRoom extends RoomManager {
  override get() {
    return {
      apply: async () => ({ street: 'preflop', pot: 0, players: [] }),
      getPublicState: async () => ({ street: 'preflop', pot: 0, players: [] }),
    } as any;
  }
}

class DummyAnalytics {
  async recordGameEvent(): Promise<void> {}
}

describe('GameGateway fuzz tests', () => {
  it('handles malformed actions without throwing', async () => {
    await fc.assert(
      fc.asyncProperty(fc.object(), async (payload) => {
        const gateway = new GameGateway(
          new DummyRoom() as any,
          new DummyAnalytics() as any,
          new ClockService(),
        );
        const client: any = { id: 'c1', emit: jest.fn() };
        await expect(
          gateway.handleAction(client, { ...payload, actionId: 'x' } as any),
        ).resolves.toBeUndefined();
      }),
    );
  });

  it('acknowledges replayed actionIds', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (id) => {
        const gateway = new GameGateway(
          new DummyRoom() as any,
          new DummyAnalytics() as any,
          new ClockService(),
        );
        const client: any = { id: 'c1', emit: jest.fn() };
        const action = { type: 'next', actionId: id } as any;
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
