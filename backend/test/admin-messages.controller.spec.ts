import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminMessagesController } from '../src/routes/admin-messages.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('AdminMessagesController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminMessagesController],
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
    const res = await request(app.getHttpServer())
      .get('/admin/messages')
      .expect(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages[0].sender).toBe('Alice');
  });

  it('rejects empty reply', async () => {
    await request(app.getHttpServer())
      .post('/admin/messages/1/reply')
      .send({ reply: '' })
      .expect(400);
  });

  it('replies to a message', async () => {
    await request(app.getHttpServer())
      .post('/admin/messages/1/reply')
      .send({ reply: 'hello' })
      .expect(200)
      .expect({ message: 'sent' });
  });

  it('returns 404 for missing message', async () => {
    await request(app.getHttpServer())
      .post('/admin/messages/999/reply')
      .send({ reply: 'hello' })
      .expect(404);
  });
});
