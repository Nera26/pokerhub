import { EventEmitter } from 'events';

describe('SpectatorGateway', () => {
  let SpectatorGateway: any;
  let addMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    addMock = jest.fn();
    const getMeterMock = jest.fn(() => ({
      createCounter: jest.fn(() => ({ add: addMock })),
    }));
    jest.doMock('@opentelemetry/api', () => ({ metrics: { getMeter: getMeterMock } }));
    jest.doMock('../../src/game/room.service', () => ({ RoomManager: jest.fn() }));
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

  it('emits state updates to connected spectators', async () => {
    class DummyRoom extends EventEmitter {
      state = 0;
      async getPublicState() {
        return { n: ++this.state };
      }
    }

    const room = new DummyRoom();
    const rooms = { get: () => room } as any;
    const gateway = new SpectatorGateway(rooms);
    const client = createClient();
    const getStateSpy = jest.spyOn(room, 'getPublicState');

    await gateway.handleConnection(client);
    room.emit('state', { n: 2 });
    await new Promise((r) => setImmediate(r));

    expect(getStateSpy).toHaveBeenCalledTimes(1);
    const states = client.emit.mock.calls
      .filter(([ev]) => ev === 'state')
      .map(([, s]) => s);
    expect(states).toEqual([{ n: 1 }, { n: 2 }]);
  });

  it('increments dropped-frame metric when client is disconnected', async () => {
    class DummyRoom extends EventEmitter {
      async getPublicState() {
        return {};
      }
    }

    const room = new DummyRoom();
    const rooms = { get: () => room } as any;
    const gateway = new SpectatorGateway(rooms);
    const client = createClient();

    await gateway.handleConnection(client);
    room.emit('state', {});
    await new Promise((r) => setImmediate(r));
    expect(addMock).not.toHaveBeenCalled();

    client.connected = false;
    room.emit('state', {});
    await new Promise((r) => setImmediate(r));
    expect(addMock).toHaveBeenCalledTimes(1);

    const states = client.emit.mock.calls
      .filter(([ev]) => ev === 'state')
      .length;
    expect(states).toBe(2); // initial + first update only
  });
});

