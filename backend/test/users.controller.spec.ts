import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UsersService } from '../src/users/users.service';
import { UserSchema } from '@shared/types';
import { initUserTestApp } from './utils/user-controller';

describe('UsersController ID validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await initUserTestApp([
      {
        provide: UsersService,
        useValue: {
          findById: jest.fn(),
          update: jest.fn(),
          ban: jest.fn(),
          create: jest.fn(async (dto) => ({
            id: 'new-user',
            username: dto.username,
            avatarKey: dto.avatarKey,
            banned: false,
          })),
        },
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 400 for invalid id on update', async () => {
    await request(app.getHttpServer())
      .put('/users/not-a-uuid')
      .set('Authorization', 'Bearer user')
      .send({ username: 'alice' })
      .expect(400);
  });

  it('returns 400 for invalid id on get', async () => {
    await request(app.getHttpServer())
      .get('/users/not-a-uuid')
      .set('Authorization', 'Bearer user')
      .expect(400);
  });

  it('returns 400 for invalid id on ban', async () => {
    await request(app.getHttpServer())
      .post('/users/not-a-uuid/ban')
      .set('Authorization', 'Bearer admin')
      .send({})
      .expect(400);
  });

  it('creates a user using shared schema', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer admin')
      .send({ username: 'alice' })
      .expect(201);
    const parsed = UserSchema.parse(res.body);
    expect(parsed.username).toBe('alice');
  });

});
