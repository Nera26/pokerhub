import { webcrypto } from 'crypto';
process.env.JWT_SECRET = 'secret';
(global as any).crypto = webcrypto;

import { Test } from '@nestjs/testing';
import type { INestApplication, ExecutionContext } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { NotificationsModule } from '../src/notifications/notifications.module';
import { Notification } from '../src/notifications/notification.entity';
import { AuthGuard } from '../src/auth/auth.guard';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

jest.setTimeout(10000);

describe('Notifications', () => {
  let app: INestApplication;
  let repo: Repository<Notification>;

  beforeAll(async () => {
    let dataSource: DataSource;
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          useFactory: () => {
            const db = newDb();
            db.public.registerFunction({
              name: 'version',
              returns: 'text',
              implementation: () => 'pg-mem',
            });
            db.public.registerFunction({
              name: 'current_database',
              returns: 'text',
              implementation: () => 'test',
            });
            let seq = 1;
            db.public.registerFunction({
              name: 'uuid_generate_v4',
              returns: 'text',
              implementation: () => {
                const id = seq.toString(16).padStart(32, '0');
                seq++;
                return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
              },
            });
            dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: [Notification],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        NotificationsModule,
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
      .compile();

    repo = moduleRef.get(getRepositoryToken(Notification));
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('stores notifications from events', async () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    await repo.save({
      userId,
      type: 'system',
      title: 'hello',
      message: 'hello',
      read: false,
    });

    const res = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${userId}`)
      .expect(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].message).toBe('hello');

    const unread = await request(app.getHttpServer())
      .get('/notifications/unread')
      .set('Authorization', `Bearer ${userId}`)
      .expect(200);
    expect(unread.body).toEqual({ count: 1 });
  });

  it('returns 400 for invalid id on mark-one', async () => {
    await request(app.getHttpServer())
      .post('/notifications/not-a-uuid')
      .set('Authorization', 'Bearer user')
      .send({})
      .expect(400);
  });
});

