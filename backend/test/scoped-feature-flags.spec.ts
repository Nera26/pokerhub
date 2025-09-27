import { EventEmitter } from 'events';
import { Test } from '@nestjs/testing';

jest.mock('p-queue', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ add: (fn: any) => fn() })),
}));

import { GameGateway } from '../src/game/game.gateway';
import { ClockService } from '../src/game/clock.service';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { EventPublisher } from '../src/events/events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../src/database/entities/hand.entity';
import { GameState } from '../src/database/entities/game-state.entity';
import { RoomManager } from '../src/game/room.service';
import { FeatureFlagsService } from '../src/feature-flags/feature-flags.service';
import { TournamentService } from '../src/tournament/tournament.service';
import { Tournament } from '../src/database/entities/tournament.entity';
import { Seat } from '../src/database/entities/seat.entity';
import { Table } from '../src/database/entities/table.entity';
import { TournamentScheduler } from '../src/tournament/scheduler.service';
import { RebuyService } from '../src/tournament/rebuy.service';
import { PkoService } from '../src/tournament/pko.service';
import { TournamentsProducer } from '../src/messaging/tournaments/tournaments.producer';
import { BotProfileRepository } from '../src/tournament/bot-profile.repository';
import { TournamentFilterOptionRepository } from '../src/tournament/tournament-filter-option.repository';
import { TournamentFormatRepository } from '../src/tournament/tournament-format.repository';
import { createInMemoryRedis } from './utils/mock-redis';

class MockSocket extends EventEmitter {
  id = Math.random().toString(36).slice(2);
  emitted: Record<string, any[]> = {};
  emit(event: string, payload: any) {
    if (!this.emitted[event]) this.emitted[event] = [];
    this.emitted[event].push(payload);
    return super.emit(event, payload);
  }
  handshake = { auth: {} } as any;
}

describe('Scoped feature flags', () => {
  describe('GameGateway', () => {
    let gateway: GameGateway;
    let flags: FeatureFlagsService;
    let replayMock: jest.Mock;

    beforeAll(async () => {
      const { redis } = createInMemoryRedis();
      const moduleRef = await Test.createTestingModule({
        providers: [
          GameGateway,
          ClockService,
          FeatureFlagsService,
          { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
          { provide: EventPublisher, useValue: { emit: jest.fn() } },
          { provide: getRepositoryToken(Hand), useValue: { findOne: jest.fn() } },
          {
            provide: getRepositoryToken(GameState),
            useValue: { find: jest.fn().mockResolvedValue([]), save: jest.fn() },
          },
          {
            provide: RoomManager,
            useValue: {
              get: () => ({
                replay: (replayMock = jest.fn(async () => ({
                  phase: 'DEAL',
                  street: 'preflop',
                  pot: 5,
                  sidePots: [],
                  currentBet: 0,
                  players: [],
                  communityCards: [],
                }))),
                resume: async () => [],
                getPublicState: async () => ({
                  phase: 'DEAL',
                  street: 'preflop',
                  pot: 5,
                  sidePots: [],
                  currentBet: 0,
                  players: [],
                  communityCards: [],
                }),
              }),
            },
          },
          { provide: 'REDIS_CLIENT', useValue: redis },
        ],
      }).compile();

      gateway = moduleRef.get(GameGateway);
      flags = moduleRef.get(FeatureFlagsService);
    });

    it('halts dealing when room flag disabled and resumes when enabled', async () => {
      const socket = new MockSocket();
      await flags.setRoom('default', 'dealing', false);
      await gateway.handleReplay(socket as any);
      expect(socket.emitted['server:Error'][0]).toBe('dealing disabled');
      expect(socket.emitted['state']).toBeUndefined();

      await flags.setRoom('default', 'dealing', true);
      await gateway.handleReplay(socket as any);
      expect(replayMock).toHaveBeenCalledTimes(1);
      expect(socket.emitted['state']).toHaveLength(1);
    });
  });

  describe('TournamentService', () => {
    let service: TournamentService;
    let flags: FeatureFlagsService;
    let pko: { settleBounty: jest.Mock };

    beforeAll(async () => {
      const { redis } = createInMemoryRedis();
      const moduleRef = await Test.createTestingModule({
        providers: [
          TournamentService,
          FeatureFlagsService,
          { provide: EventPublisher, useValue: { emit: jest.fn() } },
          { provide: getRepositoryToken(Tournament), useValue: {} },
          { provide: getRepositoryToken(Seat), useValue: {} },
          { provide: getRepositoryToken(Table), useValue: {} },
          { provide: TournamentScheduler, useValue: {} },
          { provide: RoomManager, useValue: {} },
          { provide: RebuyService, useValue: {} },
          { provide: PkoService, useValue: (pko = { settleBounty: jest.fn(() => ({ playerAward: 10, newBounty: 20 })) }) },
          { provide: BotProfileRepository, useValue: { find: jest.fn() } },
          { provide: TournamentFilterOptionRepository, useValue: { find: jest.fn() } },
          { provide: TournamentFormatRepository, useValue: { find: jest.fn() } },
          { provide: TournamentsProducer, useValue: { publish: jest.fn() } },
          { provide: 'REDIS_CLIENT', useValue: redis },
        ],
      }).compile();

      service = moduleRef.get(TournamentService);
      flags = moduleRef.get(FeatureFlagsService);
    });

    it('halts settlement when tournament flag disabled and resumes when enabled', async () => {
      await flags.setTourney('t1', 'settlement', false);
      const res1 = await service.settleBounty(100, 't1');
      expect(res1).toEqual({ playerAward: 0, newBounty: 100 });
      expect(pko.settleBounty).not.toHaveBeenCalled();

      await flags.setTourney('t1', 'settlement', true);
      const res2 = await service.settleBounty(100, 't1');
      expect(pko.settleBounty).toHaveBeenCalledTimes(1);
      expect(res2).toEqual({ playerAward: 10, newBounty: 20 });
    });
  });
});
