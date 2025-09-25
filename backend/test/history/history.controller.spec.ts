import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { newDb } from 'pg-mem';
import { AuthGuard } from '../../src/auth/auth.guard';
import {
  GameHistory,
  TournamentBracket,
  TournamentHistory,
  WalletHistory,
} from '../../src/history/history.entity';
import {
  HistoryRepository,
  GAME_HISTORY_REPOSITORY,
  TOURNAMENT_BRACKET_REPOSITORY,
  TOURNAMENT_HISTORY_REPOSITORY,
  WALLET_HISTORY_REPOSITORY,
} from '../../src/history/history.repository';
import { HistoryModule } from '../../src/history/history.module';

describe('HistoryController', () => {
  let app: INestApplication;
  let gameRepo: HistoryRepository<GameHistory>;
  let tournamentRepo: HistoryRepository<TournamentHistory>;
  let walletRepo: HistoryRepository<WalletHistory>;
  let bracketRepo: HistoryRepository<TournamentBracket>;
  let tournamentId: string;
  const ownerId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    let dataSource: any;
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => {
            const db = newDb();
            db.public.registerFunction({
              name: 'now',
              returns: 'timestamp',
              implementation: () => new Date(),
            });
            db.public.registerFunction({
              name: 'current_database',
              returns: 'text',
              implementation: () => 'test',
            });
            db.public.registerFunction({
              name: 'version',
              returns: 'text',
              implementation: () => 'pg-mem',
            });
            db.public.registerFunction({
              name: 'uuid_generate_v4',
              returns: 'uuid',
              implementation: () => crypto.randomUUID(),
            });
            dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: [
                GameHistory,
                TournamentHistory,
                WalletHistory,
                TournamentBracket,
              ],
              synchronize: true,
            });
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        HistoryModule,
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const header = req.headers['x-user-id'];
          if (Array.isArray(header)) {
            req.userId = header[0] ?? ownerId;
          } else if (typeof header === 'string') {
            req.userId = header;
          } else {
            req.userId = ownerId;
          }
          return true;
        },
      })
      .compile();

    gameRepo = moduleRef.get<HistoryRepository<GameHistory>>(GAME_HISTORY_REPOSITORY);
    tournamentRepo = moduleRef.get<HistoryRepository<TournamentHistory>>(TOURNAMENT_HISTORY_REPOSITORY);
    walletRepo = moduleRef.get<HistoryRepository<WalletHistory>>(WALLET_HISTORY_REPOSITORY);
    bracketRepo = moduleRef.get<HistoryRepository<TournamentBracket>>(TOURNAMENT_BRACKET_REPOSITORY);

    await gameRepo.save({
      id: '00000000-0000-0000-0000-000000000101',
      type: 'cash',
      stakes: '$1/$2',
      buyin: '$100',
      date: new Date('2024-01-01T00:00:00Z'),
      profit: true,
      amount: '$50',
    });

    await gameRepo.save({
      id: '00000000-0000-0000-0000-000000000102',
      type: 'cash',
      stakes: '$2/$5',
      buyin: '$200',
      date: new Date('2024-01-02T00:00:00Z'),
      profit: false,
      amount: '-$25',
    });

    const tournament = await tournamentRepo.save({
      name: 'Sunday Major',
      place: '1',
      buyin: '$50',
      prize: '$500',
      duration: '2h',
    });
    tournamentId = tournament.id;

    await bracketRepo.save({
      tournamentId,
      userId: ownerId,
      rounds: [
        {
          name: 'Finals',
          matches: [
            {
              id: 'match-1',
              players: ['Player A', 'Player B'],
              winner: 'Player A',
            },
          ],
        },
      ],
    });

    await walletRepo.save({
      id: '00000000-0000-0000-0000-000000000201',
      date: new Date('2024-02-01T00:00:00Z'),
      type: 'deposit',
      amount: '$100',
      status: 'completed',
    });

    await walletRepo.save({
      id: '00000000-0000-0000-0000-000000000202',
      date: new Date('2024-02-02T00:00:00Z'),
      type: 'withdrawal',
      amount: '-$50',
      status: 'completed',
    });

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns game history', async () => {
    const res = await request(app.getHttpServer())
      .get('/history/games')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(res.body).toEqual({
      nextCursor: null,
      total: 2,
      items: [
        {
          id: expect.any(String),
          type: 'cash',
          stakes: '$2/$5',
          buyin: '$200',
          date: '2024-01-02T00:00:00.000Z',
          profit: false,
          amount: -25,
          currency: 'USD',
        },
        {
          id: expect.any(String),
          type: 'cash',
          stakes: '$1/$2',
          buyin: '$100',
          date: '2024-01-01T00:00:00.000Z',
          profit: true,
          amount: 50,
          currency: 'USD',
        },
      ],
    });
  });

  it('supports filtering and pagination for game history', async () => {
    const firstPage = await request(app.getHttpServer())
      .get('/history/games')
      .query({ limit: 1 })
      .set('Authorization', 'Bearer test')
      .expect(200);

    expect(firstPage.body.items).toHaveLength(1);
    expect(firstPage.body.nextCursor).toBe('1');
    expect(firstPage.body.items[0]).toMatchObject({ profit: false });
    expect(firstPage.body.total).toBe(2);

    const secondPage = await request(app.getHttpServer())
      .get('/history/games')
      .query({ cursor: firstPage.body.nextCursor })
      .set('Authorization', 'Bearer test')
      .expect(200);

    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.nextCursor).toBeNull();
    expect(secondPage.body.items[0]).toMatchObject({ profit: true });
    expect(secondPage.body.total).toBe(2);

    const filtered = await request(app.getHttpServer())
      .get('/history/games')
      .query({ profitLoss: 'win' })
      .set('Authorization', 'Bearer test')
      .expect(200);

    expect(filtered.body.items).toHaveLength(1);
    expect(filtered.body.items[0]).toMatchObject({ profit: true });
    expect(filtered.body.total).toBe(1);
  });

  it('returns tournament history', async () => {
    const res = await request(app.getHttpServer())
      .get('/history/tournaments')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(res.body).toEqual({
      nextCursor: null,
      total: 1,
      items: [
        {
          id: expect.any(String),
          name: 'Sunday Major',
          place: '1',
          buyin: '$50',
          prize: '$500',
          duration: '2h',
        },
      ],
    });
  });

  it('returns wallet transactions', async () => {
    const res = await request(app.getHttpServer())
      .get('/history/transactions')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(res.body).toEqual({
      nextCursor: null,
      total: 2,
      items: [
        {
          date: '2024-02-02T00:00:00.000Z',
          type: 'withdrawal',
          amount: -50,
          currency: 'USD',
          status: 'completed',
        },
        {
          date: '2024-02-01T00:00:00.000Z',
          type: 'deposit',
          amount: 100,
          currency: 'USD',
          status: 'completed',
        },
      ],
    });
  });

  it('supports filtering wallet transactions by profit/loss', async () => {
    const res = await request(app.getHttpServer())
      .get('/history/transactions')
      .query({ profitLoss: 'win', limit: 1 })
      .set('Authorization', 'Bearer test')
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      type: 'deposit',
      amount: 100,
    });
    expect(res.body.nextCursor).toBeNull();
    expect(res.body.total).toBe(1);
  });

  it('returns tournament bracket for owner', async () => {
    const res = await request(app.getHttpServer())
      .get(`/history/tournaments/${tournamentId}/bracket`)
      .set('Authorization', 'Bearer test')
      .set('x-user-id', ownerId)
      .expect(200);

    expect(res.body).toEqual({
      tournamentId,
      rounds: [
        {
          name: 'Finals',
          matches: [
            {
              id: 'match-1',
              players: ['Player A', 'Player B'],
              winner: 'Player A',
            },
          ],
        },
      ],
    });
  });

  it('allows admin access to tournament bracket', async () => {
    await request(app.getHttpServer())
      .get(`/history/tournaments/${tournamentId}/bracket`)
      .set('Authorization', 'Bearer test')
      .set('x-user-id', 'admin')
      .expect(200);
  });

  it('forbids access for other users', async () => {
    await request(app.getHttpServer())
      .get(`/history/tournaments/${tournamentId}/bracket`)
      .set('Authorization', 'Bearer test')
      .set('x-user-id', '00000000-0000-0000-0000-000000000002')
      .expect(403);
  });
});

