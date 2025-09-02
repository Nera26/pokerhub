process.env.DATABASE_URL = '';
process.env.REDIS_URL = 'redis://localhost';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.GCP_PROJECT = 'test-project';
process.env.GCS_BUCKET = 'bucket';
process.env.GCS_EMULATOR_HOST = 'http://localhost';
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'key.json';
process.env.JWT_SECRET = 'secret';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';

import { NotificationsModule } from '../src/notifications/notifications.module';
import { Notification } from '../src/notifications/notification.entity';
import { AuthGuard } from '../src/auth/auth.guard';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
class TestUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;
}

describe('NotificationsController (e2e)', () => {
  let app: INestApplication;
  let notificationRepo: Repository<Notification>;
  let userRepo: Repository<TestUser>;
  const userId = '11111111-1111-1111-1111-111111111111';
  const notificationId = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    let dataSource: DataSource;
    @Module({
      imports: [
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
            db.public.registerFunction({
              name: 'uuid_generate_v4',
              returns: 'text',
              implementation: () => '00000000-0000-0000-0000-000000000000',
            });
            dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: [Notification, TestUser],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([TestUser]),
        NotificationsModule,
      ],
    })
    class TestAppModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
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

    notificationRepo = moduleFixture.get<Repository<Notification>>(getRepositoryToken(Notification));
    userRepo = moduleFixture.get<Repository<TestUser>>(getRepositoryToken(TestUser));

    app = moduleFixture.createNestApplication();
    await app.init();

    await userRepo.save({ id: userId, username: 'alice' });
    await notificationRepo.save({
      id: notificationId,
      userId,
      type: 'system',
      title: 'Welcome',
      message: 'Hello',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns notifications and marks them read', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${userId}`)
      .expect(200);
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0]).toEqual(
      expect.objectContaining({
        id: notificationId,
        read: false,
        title: 'Welcome',
        message: 'Hello',
      }),
    );

    await request(app.getHttpServer())
      .post(`/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${userId}`)
      .expect(201);

    const res2 = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${userId}`)
      .expect(200);
    expect(res2.body.notifications[0].read).toBe(true);
  });
});

