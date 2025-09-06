import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TournamentService } from './tournament.service';
import { Tournament } from '../database/entities/tournament.entity';
import { Seat } from '../database/entities/seat.entity';
import { Table } from '../database/entities/table.entity';
import { TournamentScheduler } from './scheduler.service';
import { RoomManager } from '../game/room.service';
import { RebuyService } from './rebuy.service';
import { PkoService } from './pko.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { EventPublisher } from '../events/events.service';

describe('TournamentService get', () => {
  let service: TournamentService;
  const tournaments: any = { findOne: jest.fn() };
  const seats: any = { count: jest.fn(), exists: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TournamentService,
        FeatureFlagsService,
        { provide: EventPublisher, useValue: {} },
        { provide: getRepositoryToken(Tournament), useValue: tournaments },
        { provide: getRepositoryToken(Seat), useValue: seats },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: TournamentScheduler, useValue: {} },
        { provide: RoomManager, useValue: {} },
        { provide: RebuyService, useValue: {} },
        { provide: PkoService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(TournamentService);
  });

  it('returns overview structure and prizes', async () => {
    tournaments.findOne.mockResolvedValue({
      id: 't1',
      title: 'Spring',
      buyIn: 100,
      currency: 'USD',
      prizePool: 1000,
      state: 'REG_OPEN',
      maxPlayers: 100,
      registrationOpen: null,
      registrationClose: null,
    });
    seats.count.mockResolvedValue(0);
    seats.exists.mockResolvedValue(false);

    const result = await service.get('t1', 'u1');
    expect(result.overview).toBeDefined();
    expect(result.structure).toBeDefined();
    expect(result.prizes).toBeDefined();
  });
});
