import type { INestApplication } from '@nestjs/common';
import AdminWithdrawalsController from '../src/routes/admin-withdrawals.controller';
import setupAdminAuth from './utils/admin-auth';
import type { PendingWithdrawal } from '@shared/types';
import type { WalletService } from '../src/wallet/wallet.service';

describe('AdminWithdrawalsController auth', () => {
  let app: INestApplication;
  let expectUnauthenticated: () => Promise<any>;
  let expectForbidden: () => Promise<any>;
  const wallet = {
    listPendingWithdrawals: jest.fn<Promise<PendingWithdrawal[]>, []>(),
  } as jest.Mocked<Pick<WalletService, 'listPendingWithdrawals'>>;

  beforeAll(async () => {
    ({ app, expectUnauthenticated, expectForbidden } = await setupAdminAuth(
      AdminWithdrawalsController,
      '/admin/withdrawals',
      wallet,
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    wallet.listPendingWithdrawals.mockClear();
  });

  it('rejects unauthenticated requests', async () => {
    await expectUnauthenticated();
    expect(wallet.listPendingWithdrawals).not.toHaveBeenCalled();
  });

  it('rejects non-admin requests', async () => {
    await expectForbidden();
    expect(wallet.listPendingWithdrawals).not.toHaveBeenCalled();
  });
});
