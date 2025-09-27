import { EventEmitter } from 'events';

describe('SpectatorGateway', () => {
  let SpectatorGateway: any;
  let addMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('p-queue', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        add: (fn: any) => Promise.resolve().then(fn),
        size: 0,
        pending: 0,
        clear: jest.fn(),
      })),
    }));
    addMock = jest.fn();
    const getMeterMock = jest.fn(() => ({
      createCounter: jest.fn(() => ({ add: addMock })),
      createHistogram: jest.fn(() => ({ record: jest.fn() })),
      createObservableGauge: jest.fn(() => ({
        addCallback: jest.fn(),
        removeCallback: jest.fn(),
      })),
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
        return { n: ++this.state, players: [] };
      }
    }

    const room = new DummyRoom();
    const rooms = { get: () => room } as any;
    const gateway = new SpectatorGateway(rooms);
    const client = createClient();
    const getStateSpy = jest.spyOn(room, 'getPublicState');

    await gateway.handleConnection(client);
    room.emit('state', { n: 2, players: [] });
    await new Promise((r) => setImmediate(r));

    expect(getStateSpy).toHaveBeenCalledTimes(1);
    const states = client.emit.mock.calls
      .filter(([ev]) => ev === 'state')
      .map(([, s]) => s);
    const payloads = states.map(({ serverTime, ...rest }) => rest);
    expect(payloads).toEqual([
      { n: 1, players: [] },
      { n: 2, players: [] },
    ]);
    states.forEach((state) =>
      expect(typeof state.serverTime === 'number').toBe(true),
    );
  });

  it('increments dropped-frame metric when client is disconnected', async () => {
    class DummyRoom extends EventEmitter {
      async getPublicState() {
        return { players: [] };
      }
    }

    const room = new DummyRoom();
    const rooms = { get: () => room } as any;
    const gateway = new SpectatorGateway(rooms);
    const client = createClient();

    await gateway.handleConnection(client);
    room.emit('state', { players: [] });
    await new Promise((r) => setImmediate(r));
    expect(addMock).not.toHaveBeenCalled();

    client.connected = false;
    room.emit('state', { players: [] });
    await new Promise((r) => setImmediate(r));
    expect(addMock).toHaveBeenCalledTimes(1);

    const states = client.emit.mock.calls
      .filter(([ev]) => ev === 'state')
      .length;
    expect(states).toBe(2); // initial + first update only
  });
});

