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

function createRedis() {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
    keys: async (pattern: string) => {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return Array.from(store.keys()).filter((k) => regex.test(k));
    },
    mget: async (keys: string[]) => keys.map((k) => store.get(k) ?? null),
  } as any;
}

describe('TournamentService level persistence', () => {
  let redis: any;

  beforeEach(() => {
    redis = createRedis();
  });

  async function createService() {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TournamentService,
        FeatureFlagsService,
        { provide: EventPublisher, useValue: {} },
        { provide: getRepositoryToken(Tournament), useValue: {} },
        { provide: getRepositoryToken(Seat), useValue: {} },
        { provide: getRepositoryToken(Table), useValue: {} },
        { provide: TournamentScheduler, useValue: {} },
        { provide: RoomManager, useValue: {} },
        { provide: RebuyService, useValue: {} },
        { provide: PkoService, useValue: {} },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    const service = moduleRef.get(TournamentService);
    await service.onModuleInit();
    return { service, moduleRef };
  }

  it('restores level state from redis', async () => {
    const { service: s1, moduleRef: m1 } = await createService();
    await s1.handleLevelUp('t1', 3);
    await s1.hotPatchLevel('t1', 2, 50, 100);
    await m1.close();

    const { service: s2, moduleRef: m2 } = await createService();
    expect(s2.getCurrentLevel('t1')).toBe(3);
    expect(s2.getHotPatchedLevel('t1', 2)).toEqual({ smallBlind: 50, bigBlind: 100 });
    await m2.close();
  });
});
