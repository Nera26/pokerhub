process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { APP_FILTER } from '@nestjs/core';

import { AdminMessagesController } from '../src/routes/admin-messages.controller';
import { AdminMessagesService } from '../src/notifications/admin-messages.service';
import { AdminMessageEntity } from '../src/notifications/admin-message.entity';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { ZodExceptionFilter } from '../src/common/zod-exception.filter';

describe('AdminMessagesController (integration)', () => {
  let app: INestApplication;
  let dataSource!: DataSource;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
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
            dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: [AdminMessageEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([AdminMessageEntity]),
      ],
      controllers: [AdminMessagesController],
      providers: [
        AdminMessagesService,
        { provide: APP_FILTER, useClass: ZodExceptionFilter },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('marks a message as read and returns updated payload', async () => {
    const repo = dataSource.getRepository(AdminMessageEntity);
    const saved = await repo.save({
      sender: 'Alice',
      userId: 'user1',
      avatar: '/avatar.png',
      subject: 'Hello',
      preview: 'Preview',
      content: 'Content',
      time: new Date('2024-01-01T00:00:00Z'),
      read: false,
    });

    const response = await request(app.getHttpServer())
      .post(`/admin/messages/${saved.id}/read`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: saved.id,
      sender: 'Alice',
      read: true,
    });
    expect(typeof response.body.time).toBe('string');

    const reloaded = await repo.findOne({ where: { id: saved.id } });
    expect(reloaded?.read).toBe(true);
  });

  it('returns 404 when message does not exist', async () => {
    await request(app.getHttpServer())
      .post('/admin/messages/999/read')
      .expect(404);
  });
});
