process.env.DATABASE_URL = '';
process.env.REDIS_URL = 'redis://localhost';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.GCP_PROJECT = 'test-project';
process.env.GCS_BUCKET = 'bucket';
process.env.GCS_EMULATOR_HOST = 'http://localhost';
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'key.json';
process.env.JWT_SECRET = 'secret';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, ExecutionContext } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { UsersService } from '../src/users/users.service';
import { UsersController } from '../src/routes/users.controller';
import { UserRepository } from '../src/users/user.repository';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
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
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          const header = req.headers['authorization'];
          if (typeof header === 'string' && header.startsWith('Bearer ')) {
            (req as any).userId = header.slice(7);
            return true;
          }
          return false;
        },
      })
      .overrideGuard(AdminGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          const header = req.headers['authorization'];
          if (header === 'Bearer admin') {
            (req as any).userId = 'admin';
            return true;
          }
          return false;
        },
      })
      .compile();
    service = moduleFixture.get(UsersService);
    await service.reset();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('creates a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer admin')
      .send({ username: 'alice' })
      .expect(201);
    expect(res.body.username).toBe('alice');
  });

  it('rejects invalid create', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer admin')
      .send({})
      .expect(400);
  });

  it('updates a user', async () => {
    const create = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer admin')
      .send({ username: 'bob' });
    const id = create.body.id;
    const res = await request(app.getHttpServer())
      .put(`/users/${id}`)
      .set('Authorization', `Bearer ${id}`)
      .send({ username: 'bobby' })
      .expect(200);
    expect(res.body.username).toBe('bobby');
  });

  it('returns 404 for missing user update', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    await request(app.getHttpServer())
      .put(`/users/${id}`)
      .set('Authorization', `Bearer ${id}`)
      .send({ username: 'x' })
      .expect(404);
  });

  it('gets a user', async () => {
    const create = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer admin')
      .send({ username: 'dave' });
    const id = create.body.id;
    const res = await request(app.getHttpServer())
      .get(`/users/${id}`)
      .set('Authorization', `Bearer ${id}`)
      .expect(200);
    expect(res.body.username).toBe('dave');
  });

  it('returns 404 for missing user', async () => {
    const missing = '00000000-0000-0000-0000-000000000001';
    await request(app.getHttpServer())
      .get(`/users/${missing}`)
      .set('Authorization', `Bearer ${missing}`)
      .expect(404);
  });

  it('bans a user', async () => {
    const create = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer admin')
      .send({ username: 'carol' });
    const id = create.body.id;
    await request(app.getHttpServer())
      .post(`/users/${id}/ban`)
      .set('Authorization', 'Bearer admin')
      .send({})
      .expect(200)
      .expect((res) => expect(res.body.banned).toBe(true));
  });
});

