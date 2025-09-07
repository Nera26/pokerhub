import { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UsersController } from '../../src/routes/users.controller';
import { UsersService } from '../../src/users/users.service';
import { AuthGuard } from '../../src/auth/auth.guard';
import { AdminGuard } from '../../src/auth/admin.guard';
import { SelfGuard } from '../../src/auth/self.guard';
import { CreateUserRequest, User, UserSchema } from '@shared/types';

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
            }),
            findById: async (id: string): Promise<User> => ({
              id,
              username: 'alice',
              avatarKey: undefined,
              banned: false,
            }),
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
            req.userId = header.slice(7);
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
            req.userId = 'admin';
            return true;
          }
          return false;
        },
      })
      .overrideGuard(SelfGuard)
      .useClass(SelfGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
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
