import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BankReconciliationController } from '../src/routes/bank-reconciliation.controller';
import { BankReconciliationService } from '../src/wallet/bank-reconciliation.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('BankReconciliationController', () => {
  let app: INestApplication;
  const service = {
    reconcileCsv: jest.fn(),
    reconcileApi: jest.fn(),
  } as any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BankReconciliationController],
      providers: [{ provide: BankReconciliationService, useValue: service }],
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

  beforeEach(() => {
    service.reconcileCsv.mockReset();
    service.reconcileApi.mockReset();
  });

  it('reconciles using JSON entries', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/deposits/reconcile')
      .send({ entries: [{ reference: 'abc', amount: 100 }] })
      .expect(200);
    expect(service.reconcileApi).toHaveBeenCalledWith([
      { reference: 'abc', amount: 100 },
    ]);
    expect(service.reconcileCsv).not.toHaveBeenCalled();
    expect(response.body).toEqual({ message: 'reconciled' });
  });

  it('reconciles using CSV upload', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/deposits/reconcile')
      .attach('file', Buffer.from('reference,amount\nabc,100\n'), 'recon.csv')
      .expect(200);
    expect(service.reconcileCsv).toHaveBeenCalled();
    expect(service.reconcileApi).not.toHaveBeenCalled();
    expect(response.body).toEqual({ message: 'reconciled' });
  });
});
