import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UsersService } from '../../src/users/users.service';
import { CreateUserRequest, User, UserSchema } from '@shared/types';
import { initUserTestApp } from '../utils/user-controller';

describe('Contract: UsersController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await initUserTestApp([
      {
        provide: UsersService,
        useValue: {
          create: async (dto: CreateUserRequest): Promise<User> => ({
            id: 'test-id',
            username: dto.username,
            avatarKey: dto.avatarKey,
            banned: false,
          }),
          findById: async (id: string): Promise<User> => ({
            id,
            username: 'alice',
            avatarKey: undefined,
            banned: false,
          }),
        },
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates request and response schemas', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer admin')
      .send({ username: 'alice' })
      .expect(201);

    const parsed = UserSchema.parse(res.body);
    expect(parsed.username).toBe('alice');
  });

  it('rejects invalid payloads', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', 'Bearer admin')
      .send({ username: 123 })
      .expect(400);
  });

  it('validates get user response schema', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    const res = await request(app.getHttpServer())
      .get(`/users/${id}`)
      .set('Authorization', `Bearer ${id}`)
      .expect(200);
    const parsed = UserSchema.parse(res.body);
    expect(parsed.id).toBe(id);
  });
});
