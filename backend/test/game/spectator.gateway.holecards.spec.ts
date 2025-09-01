import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { SpectatorGateway } from '../../src/game/spectator.gateway';
import { RoomManager } from '../../src/game/room.service';
import type { InternalGameState } from '../../src/game/engine';

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
  constructor(private state: InternalGameState) {
    super();
  }

  async getPublicState() {
    return this.state;
  }

  emitState(state: InternalGameState) {
    this.state = state;
    this.emit('state', state);
  }
}

describe('SpectatorGateway hole card privacy', () => {
  let app: INestApplication;
  let url: string;
  let room: DummyRoom;

  beforeAll(async () => {
    const initial: InternalGameState = {
      phase: 'BETTING_ROUND',
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      deck: [1, 2, 3, 4, 5],
      communityCards: [],
      players: [
        {
          id: 'p1',
          stack: 100,
          folded: false,
          bet: 0,
          allIn: false,
          holeCards: [1, 2],
        },
        {
          id: 'p2',
          stack: 100,
          folded: false,
          bet: 0,
          allIn: false,
          holeCards: [3, 4],
        },
      ],
    };
    room = new DummyRoom(initial);
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

  it('never emits another player\'s hole cards', async () => {
    const client1 = io(url, { transports: ['websocket'], query: { tableId: 't1' } });
    const client2 = io(url, { transports: ['websocket'], query: { tableId: 't1' } });
    const states1: any[] = [];
    const states2: any[] = [];
    client1.on('state', (s) => states1.push(s));
    client2.on('state', (s) => states2.push(s));

    await waitForConnect(client1);
    await waitForConnect(client2);
    await waitFor(() => states1.length >= 1 && states2.length >= 1, 500);

    // Emit another state
    room.emitState({ ...room['state'] });
    await waitFor(() => states1.length >= 2 && states2.length >= 2, 500);

    client1.disconnect();
    client2.disconnect();

    for (const s of [...states1, ...states2]) {
      for (const p of s.players as Array<Record<string, unknown>>) {
        expect(p.holeCards).toBeUndefined();
      }
    }
  });
});
