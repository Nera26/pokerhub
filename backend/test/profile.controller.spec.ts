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
import { newDb } from 'pg-mem';
import request from 'supertest';
import { ProfileController } from '../src/routes/profile.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { UsersService } from '../src/users/users.service';
import { UserRepository } from '../src/users/user.repository';
import { User } from '../src/database/entities/user.entity';
import { Table } from '../src/database/entities/table.entity';
import { Seat } from '../src/database/entities/seat.entity';
import { Tournament } from '../src/database/entities/tournament.entity';

function createTestModule() {
  let dataSource: DataSource;
  @Module({
    imports: [
      TypeOrmModule.forRootAsync({
        useFactory: () => {
          const db = newDb();
          db.public.registerFunction({
            name: 'version',
            returns: 'text',
            implementation: () => 'pg-mem',
          });
          db.public.registerFunction({
            name: 'current_database',
            returns: 'text',
            implementation: () => 'test',
          });
          db.public.registerFunction({
            name: 'uuid_generate_v4',
            returns: 'text',
            implementation: () => '00000000-0000-0000-0000-000000000000',
          });
          dataSource = db.adapters.createTypeormDataSource({
            type: 'postgres',
            entities: [User, Table, Seat, Tournament],
            synchronize: true,
          }) as DataSource;
          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource.initialize(),
      }),
      TypeOrmModule.forFeature([User, Table, Seat, Tournament]),
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
  let userId: string;

  beforeAll(async () => {
    const ProfileTestModule = createTestModule();
    const moduleRef: TestingModule = await Test.createTestingModule({
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

    repo = moduleRef.get(UserRepository);
    const user = repo.create({
      username: 'PlayerOne23',
      email: 'playerone23@example.com',
      avatarKey:
        'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      banned: false,
    });
    const saved = await repo.save(user);
    userId = saved.id;
  });

  afterAll(async () => {
    await app.close();
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
      bank: '•••• 1234',
      location: 'United States',
      joined: '2023-01-15T00:00:00.000Z',
      bio: 'Texas grinder. Loves Omaha. Weekend warrior.',
      experience: 1234,
      balance: 1250,
    });
  });
});
