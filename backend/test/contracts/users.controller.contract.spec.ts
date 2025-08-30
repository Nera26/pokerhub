import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UsersController } from '../../src/routes/users.controller';
import { UsersService } from '../../src/users/users.service';
import {
  CreateUserRequest,
  User,
  UserSchema,
} from '../../src/schemas/users';

describe('Contract: UsersController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: async (dto: CreateUserRequest): Promise<User> => ({
              id: 'test-id',
              username: dto.username,
              avatarKey: dto.avatarKey,
              banned: false,
              balance: 0,
            }),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates request and response schemas', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ username: 'alice' })
      .expect(201);

    const parsed = UserSchema.parse(res.body);
    expect(parsed.username).toBe('alice');
  });

  it('rejects invalid payloads', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ username: 123 })
      .expect(400);
  });
});
