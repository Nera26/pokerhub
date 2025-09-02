import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UsersController } from '../src/routes/users.controller';
import { UsersService } from '../src/users/users.service';

describe('UsersController ID validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            ban: jest.fn(),
            create: jest.fn(),
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

  it('returns 400 for invalid id on update', async () => {
    await request(app.getHttpServer())
      .put('/users/not-a-uuid')
      .send({ username: 'alice' })
      .expect(400);
  });

  it('returns 400 for invalid id on get', async () => {
    await request(app.getHttpServer()).get('/users/not-a-uuid').expect(400);
  });

  it('returns 400 for invalid id on ban', async () => {
    await request(app.getHttpServer())
      .post('/users/not-a-uuid/ban')
      .send({})
      .expect(400);
  });

});
