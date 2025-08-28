process.env.DATABASE_URL = 'postgres://localhost/test';
process.env.REDIS_URL = 'redis://localhost';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'bucket';
process.env.AWS_ACCESS_KEY_ID = 'key';
process.env.AWS_SECRET_ACCESS_KEY = 'secret';
process.env.JWT_SECRET = 'secret';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { UsersService } from '../src/users/users.service';
import { UsersController } from '../src/routes/users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
class UsersTestModule {}

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let service: UsersService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersTestModule],
    }).compile();
    service = moduleFixture.get(UsersService);
    service.reset();
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

