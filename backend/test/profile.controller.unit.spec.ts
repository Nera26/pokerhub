process.env.DATABASE_URL = '';
process.env.REDIS_URL = 'redis://localhost';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.GCP_PROJECT = 'test-project';
process.env.GCS_BUCKET = 'bucket';
process.env.GCS_EMULATOR_HOST = 'http://localhost';
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'key.json';
process.env.JWT_SECRET = 'secret';

import { Test } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { ProfileController } from '../src/routes/profile.controller';
import { UsersService } from '../src/users/users.service';
import { AuthGuard } from '../src/auth/auth.guard';

describe('ProfileController (unit)', () => {
  let app: INestApplication;
  let service: UsersService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: UsersService,
          useValue: { getProfile: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.userId = 'user-1';
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    service = moduleRef.get(UsersService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns profile from UsersService', async () => {
    const profile = {
      username: 'PlayerOne23',
      email: 'playerone23@example.com',
      avatarUrl: 'avatar.jpg',
      bank: '\u2022\u2022\u2022\u2022 1234',
      location: 'United States',
      joined: '2023-01-15T00:00:00.000Z',
      bio: 'Texas grinder. Loves Omaha. Weekend warrior.',
      experience: 1234,
      balance: 1250,
    };
    (service.getProfile as jest.Mock).mockResolvedValue(profile);

    const res = await request(app.getHttpServer())
      .get('/user/profile')
      .expect(200);
    expect(res.body).toEqual(profile);
    expect(service.getProfile).toHaveBeenCalledWith('user-1');
  });
});
