import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { SpectatorGateway } from '../../src/game/spectator.gateway';
import { RoomManager } from '../../src/game/room.service';
import { GameEngine } from '../../src/game/engine';

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve) => socket.on('connect', () => resolve()));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(cond: () => boolean, timeout = 200) {
  const start = Date.now();
  while (!cond() && Date.now() - start < timeout) {
    await wait(10);
  }
}

class DummyRoom extends EventEmitter {
  constructor(private readonly engine: GameEngine) {
    super();
  }

  async getPublicState() {
    return this.engine.getPublicState();
  }

  broadcast() {
    this.emit('state', this.engine.getPublicState());
  }
}

describe('SpectatorGateway privacy over WebSocket with known hole cards', () => {
  let app: INestApplication;
  let url: string;
  let room: DummyRoom;

  beforeAll(async () => {
    const engine = await GameEngine.create(
      ['p1', 'p2'],
      { startingStack: 100, smallBlind: 1, bigBlind: 2 },
    );
    const state = engine.getState();
    (state.players[0] as any).holeCards = ['As', 'Kd'];
    (state.players[1] as any).holeCards = ['Qc', 'Jh'];

    room = new DummyRoom(engine);
    const moduleRef = await Test.createTestingModule({
      providers: [
        SpectatorGateway,
        { provide: RoomManager, useValue: { get: () => room } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((res) => server.listen(0, res));
    const address = server.address();
    url = `http://localhost:${address.port}/spectate`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('omits hole cards from emitted states', async () => {
    const client = io(url, { transports: ['websocket'], query: { tableId: 't1' } });
    const states: any[] = [];
    client.on('state', (s) => states.push(s));

    await waitForConnect(client);
    await waitFor(() => states.length >= 1, 500);
    room.broadcast();
    await waitFor(() => states.length >= 2, 500);
    client.disconnect();

    expect(states.length).toBeGreaterThanOrEqual(2);
    for (const s of states) {
      for (const player of s.players as Array<Record<string, unknown>>) {
        expect(player.holeCards).toBeUndefined();
      }
    }
  });
});

