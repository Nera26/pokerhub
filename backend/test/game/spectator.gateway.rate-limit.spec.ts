import { EventEmitter } from 'events';

describe('SpectatorGateway rate limiting', () => {
  let SpectatorGateway: any;
  let droppedMock: jest.Mock;
  let rateMock: jest.Mock;
  let queueResolvers: Array<() => void>;
  let depthCb: ((r: any) => void) | undefined;
  let utilCb: ((r: any) => void) | undefined;

  const createClient = () => {
    const disconnectHandlers: Array<() => void> = [];
    return {
      id: 'c1',
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

  beforeEach(() => {
    jest.resetModules();
    queueResolvers = [];
    let pending = 0;
    jest.mock('p-queue', () => ({
      __esModule: true,
      default: jest.fn().mockImplementation(() => ({
        add: (fn: any) =>
          new Promise<void>((resolve) => {
            pending++;
            queueResolvers.push(() => {
              pending--;
              fn();
              resolve();
            });
          }),
        get size() {
          return 0;
        },
        get pending() {
          return pending;
        },
        clear: jest.fn(),
      })),
    }));
    droppedMock = jest.fn();
    rateMock = jest.fn();
    const getMeterMock = jest.fn(() => ({
      createCounter: jest.fn((name: string) => {
        if (name === 'spectator_frames_dropped_total') {
          return { add: droppedMock };
        }
        if (name === 'spectator_rate_limit_hits_total') {
          return { add: rateMock };
        }
        return { add: jest.fn() };
      }),
      createHistogram: jest.fn(() => ({ record: jest.fn() })),
      createObservableGauge: jest
        .fn()
        .mockImplementation((name: string) => {
          if (name === 'ws_outbound_queue_depth') {
            return {
              addCallback: (cb: any) => {
                depthCb = cb;
              },
              removeCallback: jest.fn(),
            };
          }
          if (name === 'ws_outbound_queue_utilization') {
            return {
              addCallback: (cb: any) => {
                utilCb = cb;
              },
              removeCallback: jest.fn(),
            };
          }
          return { addCallback: jest.fn(), removeCallback: jest.fn() };
        }),
    }));
    jest.doMock('@opentelemetry/api', () => ({ metrics: { getMeter: getMeterMock } }));
    jest.doMock('../../src/game/room.service', () => ({ RoomManager: jest.fn() }));
    process.env.SPECTATOR_RATE_LIMIT = '1';
    process.env.SPECTATOR_INTERVAL_MS = '100';
    process.env.SPECTATOR_QUEUE_LIMIT = '1';
    ({ SpectatorGateway } = require('../../src/game/spectator.gateway'));
  });

  afterEach(() => {
    delete process.env.SPECTATOR_RATE_LIMIT;
    delete process.env.SPECTATOR_INTERVAL_MS;
    delete process.env.SPECTATOR_QUEUE_LIMIT;
  });

  it('drops frames when queue limit is exceeded', async () => {
    class DummyRoom extends EventEmitter {
      async getPublicState() {
        return { n: 0, players: [] };
      }
    }
    const room = new DummyRoom();
    const rooms = { get: () => room } as any;
    const gateway = new SpectatorGateway(rooms);
    const client = createClient();

    await gateway.handleConnection(client);
    queueResolvers.shift()?.();
    room.emit('state', { n: 1, players: [] });
    room.emit('state', { n: 2, players: [] });

    const observeDepth = jest.fn();
    depthCb?.({ observe: observeDepth });
    const observeUtil = jest.fn();
    utilCb?.({ observe: observeUtil });

    queueResolvers.shift()?.();
    await new Promise((r) => setImmediate(r));

    const states = client.emit.mock.calls
      .filter(([ev]) => ev === 'state')
      .map(([, s]) => s);
    expect(states).toEqual([
      { n: 0, players: [] },
      { n: 1, players: [] },
    ]);
    expect(rateMock).toHaveBeenCalledTimes(1);
    expect(droppedMock).toHaveBeenCalledTimes(1);
    expect(observeDepth).toHaveBeenCalledWith(1, { socketId: 'c1' });
    expect(observeUtil).toHaveBeenCalledWith(1, { socketId: 'c1' });
  });
});
