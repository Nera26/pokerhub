import { EventEmitter } from 'events';
import { GameEngine } from '../../src/game/engine';

describe('SpectatorGateway privacy', () => {
  let SpectatorGateway: any;

  beforeEach(() => {
    jest.resetModules();
    const addMock = jest.fn();
    const getMeterMock = jest.fn(() => ({
      createCounter: jest.fn(() => ({ add: addMock })),
    }));
    jest.doMock('@opentelemetry/api', () => ({ metrics: { getMeter: getMeterMock } }));
    ({ SpectatorGateway } = require('../../src/game/spectator.gateway'));
  });

  const createClient = () => {
    const disconnectHandlers: Array<() => void> = [];
    return {
      handshake: { query: { tableId: 't1' } },
      join: jest.fn(),
      emit: jest.fn(),
      on: (event: string, handler: () => void) => {
        if (event === 'disconnect') disconnectHandlers.push(handler);
      },
      get disconnectHandlers() {
        return disconnectHandlers;
      },
      connected: true,
    } as any;
  };

  it('omits hole cards from emitted states', async () => {
    const engine = await GameEngine.create(
      ['a', 'b'],
      { startingStack: 100, smallBlind: 1, bigBlind: 2 },
    );
    const state = engine.getState();
    (state.players[0] as any).holeCards = ['As', 'Kd'];
    (state.players[1] as any).holeCards = ['Qc', 'Jh'];

    class DummyRoom extends EventEmitter {
      async getPublicState() {
        return engine.getPublicState();
      }
    }

    const room = new DummyRoom();
    const rooms = { get: () => room } as any;
    const gateway = new SpectatorGateway(rooms);
    const client = createClient();

    await gateway.handleConnection(client);
    room.emit('state', await room.getPublicState());
    await new Promise((r) => setImmediate(r));

    const states = client.emit.mock.calls
      .filter(([ev]) => ev === 'state')
      .map(([, s]) => s);
    expect(states).toHaveLength(2);
    for (const s of states) {
      for (const player of s.players as Array<Record<string, unknown>>) {
        expect(player.holeCards).toBeUndefined();
        expect(player.cards).toBeUndefined();
      }
    }
  });
});
