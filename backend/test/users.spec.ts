process.env.DATABASE_URL = '';
process.env.REDIS_URL = 'redis://localhost';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.GCP_PROJECT = 'test-project';
process.env.GCS_BUCKET = 'bucket';
process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/creds.json';
process.env.JWT_SECRET = 'secret';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { UsersService } from '../src/users/users.service';
import { UsersController } from '../src/routes/users.controller';
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
      TypeOrmModule.forFeature([User]),
    ],
    controllers: [UsersController],
    providers: [UsersService, UserRepository],
  })
  class UsersTestModule {}
  return UsersTestModule;
}

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let service: UsersService;

  beforeEach(async () => {
    const UsersTestModule = createTestModule();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersTestModule],
    }).compile();
    service = moduleFixture.get(UsersService);
    await service.reset();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('creates a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ username: 'alice' })
      .expect(201);
    expect(res.body.username).toBe('alice');
    expect(res.body.balance).toBe(0);
  });

  it('rejects invalid create', async () => {
    await request(app.getHttpServer()).post('/users').send({}).expect(400);
  });

  it('updates a user', async () => {
    const create = await request(app.getHttpServer())
      .post('/users')
      .send({ username: 'bob' });
    const id = create.body.id;
    const res = await request(app.getHttpServer())
      .put(`/users/${id}`)
      .send({ username: 'bobby' })
      .expect(200);
    expect(res.body.username).toBe('bobby');
  });

  it('returns 404 for missing user update', async () => {
    await request(app.getHttpServer())
      .put('/users/missing')
      .send({ username: 'x' })
      .expect(404);
  });

  it('bans user and adjusts balance', async () => {
    const create = await request(app.getHttpServer())
      .post('/users')
      .send({ username: 'carol' });
    const id = create.body.id;
    await request(app.getHttpServer())
      .post(`/users/${id}/ban`)
      .send({})
      .expect(200)
      .expect((res) => expect(res.body.banned).toBe(true));
    await request(app.getHttpServer())
      .post(`/users/${id}/balance`)
      .send({ amount: 50 })
      .expect(200)
      .expect((res) => expect(res.body.balance).toBe(50));
  });

  it('rejects invalid balance adjustment', async () => {
    const create = await request(app.getHttpServer())
      .post('/users')
      .send({ username: 'dave' });
    const id = create.body.id;
    await request(app.getHttpServer())
      .post(`/users/${id}/balance`)
      .send({ amount: 'nope' })
      .expect(400);
  });
});

