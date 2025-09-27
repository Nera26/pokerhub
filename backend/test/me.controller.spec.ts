process.env.JWT_SECRET = 'secret';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createDataSource, destroyDataSource } from './utils/pgMem';
import { MeController } from '../src/routes/me.controller';
import { UsersService } from '../src/users/users.service';
import { UserRepository } from '../src/users/user.repository';
import { User } from '../src/database/entities/user.entity';
import { Table } from '../src/database/entities/table.entity';
import { Seat } from '../src/database/entities/seat.entity';
import { Tournament } from '../src/database/entities/tournament.entity';
import { TournamentDetail } from '../src/tournament/tournament-detail.entity';
import { AuthGuard } from '../src/auth/auth.guard';

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
            TournamentDetail,
          ]);
          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource,
      }),
      TypeOrmModule.forFeature([User, Table, Seat, Tournament, TournamentDetail]),
    ],
    controllers: [MeController],
    providers: [UsersService, UserRepository],
  })
  class MeTestModule {}
  return MeTestModule;
}

describe('MeController', () => {
  let app: INestApplication;
  let repo: UserRepository;
  let userId: string;
  let moduleRef: TestingModule;
  let dataSource: DataSource;

  beforeAll(async () => {
    const MeTestModule = createTestModule();
    moduleRef = await Test.createTestingModule({
      imports: [MeTestModule],
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
      username: 'Player',
      avatarKey: 'https://example.com/avatar.png',
      banned: false,
    });
    const saved = await repo.save(user);
    userId = saved.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await destroyDataSource(dataSource);
  });

  it('returns avatar url', async () => {
    const res = await request(app.getHttpServer())
      .get('/me')
      .expect(200);
    expect(res.body).toEqual({ avatarUrl: 'https://example.com/avatar.png' });
  });
});
