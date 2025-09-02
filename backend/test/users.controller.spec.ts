import { Test } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { UsersController } from '../src/routes/users.controller';
import { UsersService } from '../src/users/users.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

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

    app = moduleRef.createNestApplication();
    await app.init();
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

});
