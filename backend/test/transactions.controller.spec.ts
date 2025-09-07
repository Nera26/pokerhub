import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TransactionsController } from '../src/routes/transactions.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('TransactionsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TransactionsController],
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

  it('returns transaction types', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions/types')
      .set('Authorization', 'Bearer test')
      .expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        { id: 'admin-add', label: 'Admin Add' },
      ]),
    );
  });
});
