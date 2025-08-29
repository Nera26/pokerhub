import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { SpectatorGateway } from '../../src/game/spectator.gateway';
import { RoomManager } from '../../src/game/room.service';
import { GameEngine } from '../../src/game/engine';

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve) => socket.on('connect', () => resolve()))
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitFor(cond: () => boolean, timeout = 200) {
  const start = Date.now()
  while (!cond() && Date.now() - start < timeout) {
    await wait(10)
  }
}

class DummyRoom extends EventEmitter {
  private readonly engine = new (GameEngine as any)(['p1', 'p2'])

  async getPublicState() {
    return this.engine.getPublicState()
  }

  dealToFlop() {
    this.engine.applyAction({ type: 'postBlind', playerId: 'p1', amount: 1 } as any)
    this.engine.applyAction({ type: 'postBlind', playerId: 'p2', amount: 2 } as any)
    this.engine.applyAction({ type: 'next' })
    this.engine.applyAction({ type: 'next' })
    this.engine.applyAction({ type: 'next' })
  }
}

describe('SpectatorGateway mid-hand connect', () => {
  let app: INestApplication
  let url: string
  let room: DummyRoom

  beforeAll(async () => {
    room = new DummyRoom()
    room.dealToFlop()
    const moduleRef = await Test.createTestingModule({
      providers: [
        SpectatorGateway,
        { provide: RoomManager, useValue: { get: () => room } },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
    const server = app.getHttpServer()
    await new Promise<void>((res) => server.listen(0, res))
    const address = server.address()
    url = `http://localhost:${address.port}/spectate`
  })

  afterAll(async () => {
    await app.close()
  })

  it('sends only community cards to late spectators', async () => {
    const client = io(url, { transports: ['websocket'], query: { tableId: 't1' } })
    const states: any[] = []
    client.on('state', (s) => states.push(s))

    await waitForConnect(client)
    await waitFor(() => states.length >= 1, 500)
    client.disconnect()

    expect(states).toHaveLength(1)
    const [state] = states
    expect(state.communityCards.length).toBe(3)
    for (const player of state.players as Array<Record<string, unknown>>) {
      expect(player.holeCards).toBeUndefined()
      expect(player.cards).toBeUndefined()
    }
  })
})

