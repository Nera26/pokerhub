import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/routes/auth.controller';
import {
  LoginResponseSchema,
  MessageResponseSchema,
} from '@shared/types';

describe('AuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'secret' })
      .expect(200);
    const parsed = LoginResponseSchema.parse(res.body);
    expect(parsed.token).toBeDefined();
  });

  it('logs out user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .expect(200);
    const parsed = MessageResponseSchema.parse(res.body);
    expect(parsed.message).toBe('logged out');
  });

  it('requests password reset', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/request-reset')
      .send({ email: 'user@example.com' })
      .expect(200);
    const parsed = MessageResponseSchema.parse(res.body);
    expect(parsed.message).toBe('reset requested');
  });

  it('verifies reset code', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/verify-reset-code')
      .send({ email: 'user@example.com', code: '123456' })
      .expect(200);
    const parsed = MessageResponseSchema.parse(res.body);
    expect(parsed.message).toBe('code verified');
  });

  it('resets password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email: 'user@example.com', code: '123456', password: 'newpass' })
      .expect(200);
    const parsed = MessageResponseSchema.parse(res.body);
    expect(parsed.message).toBe('password reset');
  });
});
