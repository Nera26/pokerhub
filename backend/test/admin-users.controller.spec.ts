import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminUsersController } from '../src/routes/admin-users.controller';
import { UsersService } from '../src/users/users.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import {
  DashboardUserListSchema,
  DashboardUserSchema,
  UserMetaResponseSchema,
} from '@shared/types';

describe('AdminUsersController', () => {
  let app: INestApplication;
  const list = jest.fn();
  const create = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [{ provide: UsersService, useValue: { list, create } }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns users list with limit', async () => {
    list.mockResolvedValue([
      { id: '1', username: 'alice', avatarKey: undefined, balance: 0, banned: false },
    ]);
    const res = await request(app.getHttpServer())
      .get('/admin/users?limit=5')
      .expect(200);
    const parsed = DashboardUserListSchema.parse(res.body);
    expect(parsed[0].username).toBe('alice');
    expect(list).toHaveBeenCalledWith(5);
  });

  it('returns user meta', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/users/meta')
      .expect(200);
    const parsed = UserMetaResponseSchema.parse(res.body);
    expect(parsed.roles[0].value).toBe('Player');
    expect(parsed.statuses[0].value).toBe('Active');
  });

  it('creates user', async () => {
    create.mockResolvedValue({
      id: '2',
      username: 'bob',
      avatarKey: undefined,
      balance: 0,
      banned: false,
    });
    const res = await request(app.getHttpServer())
      .post('/admin/users')
      .send({ username: 'bob' })
      .expect(201);
    const parsed = DashboardUserSchema.parse(res.body);
    expect(parsed.username).toBe('bob');
    expect(create).toHaveBeenCalledWith({ username: 'bob' });
  });

  it('returns 400 on invalid data', async () => {
    await request(app.getHttpServer())
      .post('/admin/users')
      .send({})
      .expect(400);
    expect(create).not.toHaveBeenCalled();
  });
});
