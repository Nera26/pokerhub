import type { Repository, FindOneOptions, FindOptionsWhere } from 'typeorm';
import type Redis from 'ioredis';
import { Tournament } from '../../src/database/entities/tournament.entity';
import { Table } from '../../src/database/entities/table.entity';
import { Seat } from '../../src/database/entities/seat.entity';
import { TournamentService } from '../../src/tournament/tournament.service';
import type { TournamentScheduler } from '../../src/tournament/scheduler.service';
import type { RoomManager } from '../../src/game/room.service';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';
import type { FeatureFlagsService } from '../../src/feature-flags/feature-flags.service';
import type { EventPublisher } from '../../src/events/events.service';
import type { TournamentsProducer } from '../../src/messaging/tournaments/tournaments.producer';
import type { BotProfileRepository } from '../../src/tournament/bot-profile.repository';
import type { TournamentFilterOptionRepository } from '../../src/tournament/tournament-filter-option.repository';
import type { TournamentFormatRepository } from '../../src/tournament/tournament-format.repository';
import type { TournamentDetailRepository } from '../../src/tournament/tournament-detail.repository';
import type { WalletService } from '../../src/wallet/wallet.service';
import type { AdminTournamentFilterRepository } from '../../src/tournament/admin-tournament-filter.repository';

type TournamentServiceOverrides = Partial<{
  tournamentsRepo: Repository<Tournament>;
  seatsRepo: Repository<Seat>;
  tablesRepo: Repository<Table>;
  scheduler: TournamentScheduler;
  rooms: RoomManager;
  rebuys: RebuyService;
  pko: PkoService;
  flags: FeatureFlagsService;
  events: EventPublisher;
  producer: TournamentsProducer;
  botProfiles: BotProfileRepository;
  filterOptions: TournamentFilterOptionRepository;
  formatRepository: TournamentFormatRepository;
  detailsOrWallet: TournamentDetailRepository | WalletService;
  redis: Redis;
  wallet: WalletService;
  adminFilters: AdminTournamentFilterRepository;
}>;

export function createTournamentRepo(initial: Tournament[]): Repository<Tournament> {
  const items = new Map(initial.map((t) => [t.id, t]));
  return {
    find: jest.fn(async () => Array.from(items.values())),
    findOne: jest.fn(async (options?: FindOneOptions<Tournament>) => {
      const where = options?.where as FindOptionsWhere<Tournament> | undefined;
      const id = Array.isArray(where)
        ? undefined
        : (where?.id as string | undefined);
      return id ? items.get(id) : undefined;
    }),
    save: jest.fn(async (obj: Tournament) => {
      items.set(obj.id, obj);
      return obj;
    }),
  } as unknown as Repository<Tournament>;
}

export function createSeatRepo(tables: Table[]): Repository<Seat> {
  const seats = tables.flatMap((t) => t.seats);
  const items = new Map(seats.map((s) => [s.id, s]));
  return {
    find: jest.fn(async () => Array.from(items.values())),
    save: jest.fn(async (seat: Seat | Seat[]) => {
      const arr = Array.isArray(seat) ? seat : [seat];
      for (const s of arr) {
        tables.forEach((tbl) => {
          tbl.seats = tbl.seats.filter((seat) => seat.id !== s.id);
        });
        s.table.seats.push(s);
        items.set(s.id, s);
      }
      return Array.isArray(seat) ? arr : arr[0];
    }),
  } as unknown as Repository<Seat>;
}

export function createTestTable(id: string, tournament: Tournament): Table {
  return {
    id,
    name: id,
    gameType: 'texas',
    smallBlind: 1,
    bigBlind: 2,
    startingStack: 0,
    playersCurrent: 0,
    playersMax: 9,
    minBuyIn: 0,
    maxBuyIn: 0,
    handsPerHour: 0,
    avgPot: 0,
    rake: 0,
    tabs: ['history', 'chat', 'notes'],
    createdAt: new Date(0),
    tournament,
    players: [],
    seats: [],
  } as Table;
}

export function createTournamentServiceInstance(
  overrides: TournamentServiceOverrides = {},
): TournamentService {
  const tournamentsRepo =
    overrides.tournamentsRepo ?? ({} as unknown as Repository<Tournament>);
  const seatsRepo = overrides.seatsRepo ?? ({} as unknown as Repository<Seat>);
  const tablesRepo =
    overrides.tablesRepo ?? ({ find: jest.fn() } as unknown as Repository<Table>);
  const scheduler = overrides.scheduler ?? ({} as TournamentScheduler);
  const rooms = overrides.rooms ?? ({ get: jest.fn() } as unknown as RoomManager);
  const rebuys = overrides.rebuys ?? new RebuyService();
  const pko = overrides.pko ?? new PkoService();
  const flags =
    overrides.flags ?? ({ get: jest.fn().mockResolvedValue(true) } as unknown as FeatureFlagsService);
  const events =
    overrides.events ?? ({ emit: jest.fn() } as unknown as EventPublisher);
  const producer = overrides.producer ?? ({} as TournamentsProducer);
  const botProfiles = overrides.botProfiles ?? ({} as BotProfileRepository);
  const filterOptions =
    overrides.filterOptions ?? ({} as TournamentFilterOptionRepository);
  const formatRepository =
    overrides.formatRepository ?? ({} as TournamentFormatRepository);
  const detailsOrWallet = overrides.detailsOrWallet;
  const redis = overrides.redis;
  const wallet = overrides.wallet;
  const adminFilters = overrides.adminFilters;

  return new TournamentService(
    tournamentsRepo,
    seatsRepo,
    tablesRepo,
    scheduler,
    rooms,
    rebuys,
    pko,
    flags,
    events,
    producer,
    botProfiles,
    filterOptions,
    formatRepository,
    detailsOrWallet,
    redis,
    wallet,
    adminFilters,
  );
}

