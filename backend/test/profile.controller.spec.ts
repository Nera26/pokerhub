import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ProfileController } from '../src/routes/profile.controller';
import { AuthGuard } from '../src/auth/auth.guard';

describe('ProfileController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProfileController],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns user profile', async () => {
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
