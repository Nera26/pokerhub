import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminBalanceController } from '../src/routes/admin-balance.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { WalletService } from '../src/wallet/wallet.service';
import { AnalyticsService } from '../src/analytics/analytics.service';

describe('AdminBalanceController', () => {
  let app: INestApplication;
  const wallet = { adminAdjustBalance: jest.fn() } as unknown as WalletService;
  const analytics = { addAuditLog: jest.fn() } as unknown as AnalyticsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminBalanceController],
      providers: [
        { provide: WalletService, useValue: wallet },
        { provide: AnalyticsService, useValue: analytics },
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('adjusts balance and records audit', async () => {
    await request(app.getHttpServer())
      .post('/admin/balance/u1')
      .send({ action: 'add', amount: 10, currency: 'USD', notes: 'test' })
      .expect(200);
    expect(wallet.adminAdjustBalance).toHaveBeenCalledWith('u1', 'add', 10, 'USD');
    expect(analytics.addAuditLog).toHaveBeenCalled();
  });

  it('removes balance and records audit without notes', async () => {
    await request(app.getHttpServer())
      .post('/admin/balance/u1')
      .send({ action: 'remove', amount: 5, currency: 'USD' })
      .expect(200);
    expect(wallet.adminAdjustBalance).toHaveBeenCalledWith('u1', 'remove', 5, 'USD');
    expect(analytics.addAuditLog).toHaveBeenCalled();
  });
});
