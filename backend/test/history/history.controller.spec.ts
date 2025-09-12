import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { newDb } from 'pg-mem';
import { AuthGuard } from '../../src/auth/auth.guard';
import {
  GameHistory,
  TournamentHistory,
  WalletHistory,
} from '../../src/history/history.entity';
import {
  GameHistoryRepository,
  TournamentHistoryRepository,
  WalletHistoryRepository,
} from '../../src/history/history.repository';
import { HistoryModule } from '../../src/history/history.module';

describe('HistoryController', () => {
  let app: INestApplication;
  let gameRepo: GameHistoryRepository;
  let tournamentRepo: TournamentHistoryRepository;
  let walletRepo: WalletHistoryRepository;

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
              name: 'uuid_generate_v4',
              returns: 'uuid',
              implementation: () => crypto.randomUUID(),
            });
            dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: [GameHistory, TournamentHistory, WalletHistory],
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
      .useValue({ canActivate: () => true })
      .compile();

    gameRepo = moduleRef.get(GameHistoryRepository);
    tournamentRepo = moduleRef.get(TournamentHistoryRepository);
    walletRepo = moduleRef.get(WalletHistoryRepository);

    await gameRepo.save({
      type: 'cash',
      stakes: '$1/$2',
      buyin: '$100',
      date: new Date('2024-01-01T00:00:00Z'),
      profit: true,
      amount: '$50',
    });

    await tournamentRepo.save({
      name: 'Sunday Major',
      place: '1',
      buyin: '$50',
      prize: '$500',
      duration: '2h',
    });

    await walletRepo.save({
      date: new Date('2024-02-01T00:00:00Z'),
      type: 'deposit',
      amount: '$100',
      status: 'completed',
    });

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns game history', async () => {
    const res = await request(app.getHttpServer())
      .get('/history/games')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      type: 'cash',
      stakes: '$1/$2',
      buyin: '$100',
      profit: true,
      amount: '$50',
    });
  });

  it('returns tournament history', async () => {
    const res = await request(app.getHttpServer())
      .get('/history/tournaments')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      name: 'Sunday Major',
      place: '1',
      buyin: '$50',
      prize: '$500',
      duration: '2h',
    });
  });

  it('returns wallet transactions', async () => {
    const res = await request(app.getHttpServer())
      .get('/history/transactions')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      type: 'deposit',
      amount: '$100',
      status: 'completed',
    });
  });
});

