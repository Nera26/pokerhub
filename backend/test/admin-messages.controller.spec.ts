import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminMessagesController } from '../src/routes/admin-messages.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { AdminMessagesService } from '../src/notifications/admin-messages.service';
import { APP_FILTER } from '@nestjs/core';
import { ZodExceptionFilter } from '../src/common/zod-exception.filter';

describe('AdminMessagesController', () => {
  let app: INestApplication;

  const service = {
    list: jest.fn(),
    find: jest.fn(),
    markRead: jest.fn(),
  } as unknown as AdminMessagesService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminMessagesController],
      providers: [
        { provide: AdminMessagesService, useValue: service },
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
    await app.close();
  });

  it('lists messages', async () => {
    service.list.mockResolvedValueOnce([
      {
        id: 1,
        sender: 'Alice',
        userId: 'user1',
        avatar: '/avatar.png',
        subject: 'Hello',
        preview: 'Hello',
        content: 'Hello there',
        time: '2024-01-01T00:00:00Z',
        read: false,
      },
    ]);
    const res = await request(app.getHttpServer())
      .get('/admin/messages')
      .expect(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages[0].sender).toBe('Alice');
  });

  it('replies to a message', async () => {
    service.find.mockResolvedValueOnce({
      id: 1,
      sender: 'Alice',
      userId: 'user1',
      avatar: '/avatar.png',
      subject: 'Hello',
      preview: 'Hello',
      content: 'Hello there',
      time: '2024-01-01T00:00:00Z',
      read: false,
    });
    await request(app.getHttpServer())
      .post('/admin/messages/1/reply')
      .send({ reply: 'hello' })
      .expect(200)
      .expect({ message: 'sent' });
    expect(service.markRead).toHaveBeenCalledWith(1);
  });

  it('returns 404 for missing message', async () => {
    service.find.mockResolvedValueOnce(null);
    await request(app.getHttpServer())
      .post('/admin/messages/999/reply')
      .send({ reply: 'hello' })
      .expect(404);
  });
});
