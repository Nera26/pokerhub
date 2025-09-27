process.env.DATABASE_URL = '';
process.env.REDIS_URL = 'redis://localhost';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.GCP_PROJECT = 'test-project';
process.env.GCS_BUCKET = 'bucket';
process.env.GCS_EMULATOR_HOST = 'http://localhost';
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'key.json';
process.env.JWT_SECRET = 'secret';

import { webcrypto } from 'crypto';
(global as any).crypto = webcrypto;

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createDataSource, destroyDataSource } from './utils/pgMem';
import request from 'supertest';
import { ProfileController } from '../src/routes/profile.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { UsersService } from '../src/users/users.service';
import { UserRepository } from '../src/users/user.repository';
import { User } from '../src/database/entities/user.entity';
import { Table } from '../src/database/entities/table.entity';
import { Seat } from '../src/database/entities/seat.entity';
import { Tournament } from '../src/database/entities/tournament.entity';
import { Leaderboard } from '../src/database/entities/leaderboard.entity';
import { TournamentDetail } from '../src/tournament/tournament-detail.entity';

function createTestModule() {
  let dataSource: DataSource;
  @Module({
    imports: [
      TypeOrmModule.forRootAsync({
        useFactory: async () => {
          dataSource = await createDataSource([
            User,
            Table,
            Seat,
            Tournament,
            Leaderboard,
            TournamentDetail,
          ]);
          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource,
      }),
      TypeOrmModule.forFeature([
        User,
        Table,
        Seat,
        Tournament,
        Leaderboard,
        TournamentDetail,
      ]),
    ],
    controllers: [ProfileController],
    providers: [UsersService, UserRepository],
  })
  class ProfileTestModule {}
  return ProfileTestModule;
}

describe('ProfileController (integration)', () => {
  let app: INestApplication;
  let repo: UserRepository;
  let lbRepo;
  let userId: string;
  let moduleRef: TestingModule;
  let dataSource: DataSource;

  beforeAll(async () => {
    const ProfileTestModule = createTestModule();
    moduleRef = await Test.createTestingModule({
      imports: [ProfileTestModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.userId = userId;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dataSource = moduleRef.get(DataSource);
    repo = moduleRef.get(UserRepository);
    const user = repo.create({
      username: 'PlayerOne23',
      email: 'playerone23@example.com',
      avatarKey:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      banned: false,
      bank: 'Chase 1234',
      location: 'Canada',
      joined: new Date('2023-01-15T00:00:00.000Z'),
      bio: 'Texas grinder. Loves Omaha. Weekend warrior.',
      experience: 1234,
      balance: 1250,
    });
    const saved = await repo.save(user);
    userId = saved.id;

    lbRepo = moduleRef.get(DataSource).getRepository(Leaderboard);
    await lbRepo.save({
      playerId: userId,
      rank: 1,
      rating: 1,
      rd: 1,
      volatility: 1,
      net: 0,
      bb: 0,
      hands: 150,
      duration: 0,
      buyIn: 0,
      finishes: { 1: 2, 2: 1, 3: 1, 4: 6 },
    });
  });

  afterAll(async () => {
    await app.close();
    await destroyDataSource(dataSource);
  });

  it('returns user profile from database', async () => {
    const res = await request(app.getHttpServer())
      .get('/user/profile')
      .expect(200);
    expect(res.body).toEqual({
      username: 'PlayerOne23',
      email: 'playerone23@example.com',
      avatarUrl:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      bank: 'Chase 1234',
      location: 'Canada',
      joined: '2023-01-15T00:00:00.000Z',
      bio: 'Texas grinder. Loves Omaha. Weekend warrior.',
      experience: 1234,
      balance: 1250,
    });
  });

  it('returns aggregated stats from leaderboard', async () => {
    const res = await request(app.getHttpServer())
      .get('/user/profile/stats')
      .expect(200);
    expect(res.body).toEqual({
      handsPlayed: 150,
      winRate: 20,
      tournamentsPlayed: 10,
      topThreeRate: 40,
    });
  });
});
