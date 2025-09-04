import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { BankReconciliationController } from '../src/routes/bank-reconciliation.controller';
import { BankReconciliationService } from '../src/wallet/bank-reconciliation.service';
import { SessionService } from '../src/session/session.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { ConfigService } from '@nestjs/config';

describe('BankReconciliationController auth', () => {
  let app: INestApplication;
  const service = {
    reconcileCsv: jest.fn(),
    reconcileApi: jest.fn(),
  } as any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BankReconciliationController],
      providers: [
        { provide: BankReconciliationService, useValue: service },
        { provide: SessionService, useValue: { verifyAccessToken: () => 'user1' } },
        { provide: ConfigService, useValue: { get: () => ['secret'] } },
        AuthGuard,
        AdminGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    service.reconcileCsv.mockReset();
    service.reconcileApi.mockReset();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer())
      .post('/admin/deposits/reconcile')
      .send({ entries: [] })
      .expect(401);
    expect(service.reconcileApi).not.toHaveBeenCalled();
  });

  it('rejects non-admin requests', async () => {
    const token = jwt.sign({ sub: 'user1', role: 'user' }, 'secret');
    await request(app.getHttpServer())
      .post('/admin/deposits/reconcile')
      .set('Authorization', `Bearer ${token}`)
      .send({ entries: [] })
      .expect(403);
    expect(service.reconcileApi).not.toHaveBeenCalled();
  });
});
