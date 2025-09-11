import type { INestApplication } from '@nestjs/common';
import AdminDepositsController from '../src/routes/admin-deposits.controller';
import setupAdminAuth from './utils/admin-auth';

describe('AdminDepositsController auth', () => {
  let app: INestApplication;
  let expectUnauthenticated: () => Promise<any>;
  let expectForbidden: () => Promise<any>;
  const wallet = {
    listPendingDeposits: jest.fn(),
  };

  beforeAll(async () => {
    ({ app, expectUnauthenticated, expectForbidden } = await setupAdminAuth(
      AdminDepositsController,
      '/admin/deposits',
      wallet,
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    wallet.listPendingDeposits.mockClear();
  });

  it('rejects unauthenticated requests', async () => {
    await expectUnauthenticated();
    expect(wallet.listPendingDeposits).not.toHaveBeenCalled();
  });

  it('rejects non-admin requests', async () => {
    await expectForbidden();
    expect(wallet.listPendingDeposits).not.toHaveBeenCalled();
  });
});
