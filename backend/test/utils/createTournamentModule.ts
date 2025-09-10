import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TournamentService } from '../../src/tournament/tournament.service';
import { Tournament } from '../../src/database/entities/tournament.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { Table } from '../../src/database/entities/table.entity';
import { TournamentScheduler } from '../../src/tournament/scheduler.service';
import { RoomManager } from '../../src/game/room.service';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';
import { FeatureFlagsService } from '../../src/feature-flags/feature-flags.service';
import { EventPublisher } from '../../src/events/events.service';

export interface TournamentModuleOverrides {
  tournaments?: any;
  seats?: any;
  tables?: any;
  scheduler?: any;
  rooms?: any;
  rebuy?: any;
  pko?: any;
  flags?: any;
  events?: any;
  redis?: any;
}

export async function createTournamentModule(
  overrides: TournamentModuleOverrides = {},
): Promise<{ moduleRef: TestingModule; service: TournamentService }> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      TournamentService,
      overrides.flags ?? FeatureFlagsService,
      { provide: EventPublisher, useValue: overrides.events ?? {} },
      { provide: getRepositoryToken(Tournament), useValue: overrides.tournaments ?? {} },
      { provide: getRepositoryToken(Seat), useValue: overrides.seats ?? {} },
      { provide: getRepositoryToken(Table), useValue: overrides.tables ?? {} },
      { provide: TournamentScheduler, useValue: overrides.scheduler ?? {} },
      { provide: RoomManager, useValue: overrides.rooms ?? {} },
      { provide: RebuyService, useValue: overrides.rebuy ?? {} },
      { provide: PkoService, useValue: overrides.pko ?? {} },
      { provide: 'REDIS_CLIENT', useValue: overrides.redis ?? {} },
    ].flat(),
  }).compile();

  const service = moduleRef.get(TournamentService);
  if (overrides.redis && typeof service.onModuleInit === 'function') {
    await service.onModuleInit();
  }
  return { moduleRef, service };
}

export default createTournamentModule;
