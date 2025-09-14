import { Test } from '@nestjs/testing';
import { GameGateway } from '../../src/game/game.gateway';
import { ClockService } from '../../src/game/clock.service';
import { RoomManager } from '../../src/game/room.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { EventPublisher } from '../../src/events/events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../../src/database/entities/hand.entity';
import { createInMemoryRedis } from '../utils/mock-redis';
import { ConfigService } from '@nestjs/config';
import { GameState } from '../../src/database/entities/game-state.entity';

describe('player timeout', () => {
  it('folds player only at their table', async () => {
    const room1 = {
      apply: jest.fn().mockResolvedValue({ street: 'preflop', pot: 0, players: [] }),
      getPublicState: jest.fn(),
    } as any;
    const room2 = {
      apply: jest.fn().mockResolvedValue({ street: 'preflop', pot: 0, players: [] }),
      getPublicState: jest.fn(),
    } as any;
    const rooms = {
      get: (id: string) => (id === 't1' ? room1 : room2),
    } as RoomManager;

    const { redis } = createInMemoryRedis();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        ClockService,
        { provide: ConfigService, useValue: new ConfigService({ game: { actionTimeoutMs: 0 } }) },
        { provide: RoomManager, useValue: rooms },
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
        { provide: EventPublisher, useValue: { emit: jest.fn() } },
        { provide: getRepositoryToken(Hand), useValue: {} },
        { provide: getRepositoryToken(GameState), useValue: { find: jest.fn(), save: jest.fn() } },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    const gateway = moduleRef.get(GameGateway);
    const clock = moduleRef.get(ClockService);

    const emitMock = jest.fn();
    const server = { emit: jest.fn(), to: jest.fn().mockReturnValue({ emit: emitMock }) } as any;
    gateway.server = server;

    clock.setTimer('p1', 't1', () => (gateway as any).handleTimeout('p1', 't1'));
    clock.setTimer('p1', 't2', () => (gateway as any).handleTimeout('p1', 't2'), 1000);
    (clock as any).tick();
    await new Promise((r) => setImmediate(r));

    expect(room1.apply).toHaveBeenCalledTimes(1);
    expect(room2.apply).not.toHaveBeenCalled();
    expect(server.to).toHaveBeenCalledWith('t1');
    expect(emitMock).toHaveBeenCalledWith('state', expect.any(Object));

    clock.onModuleDestroy();
  });
});
