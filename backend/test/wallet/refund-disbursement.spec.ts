import { DataSource } from 'typeorm';
import { WalletService } from '../../src/wallet/wallet.service';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { createInMemoryDb, createWalletServices } from './test-utils';

describe('WalletService.refundDisbursement', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let repos: ReturnType<typeof createWalletServices>['repos'];

  beforeAll(async () => {
    dataSource = await createInMemoryDb();
    ({ service, repos } = createWalletServices(dataSource));

    await repos.account.save([
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'user',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'house',
        balance: 0,
        currency: 'USD',
      },
    ]);
    (service as any).record = jest.fn();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('records refund from house to user', async () => {
    const disb: Disbursement = {
      id: 'd',
      accountId: '11111111-1111-1111-1111-111111111111',
      amount: 100,
      idempotencyKey: 'k',
      status: 'pending',
      createdAt: new Date(),
    } as any;

    await service.refundDisbursement(disb);
    expect((service as any).record).toHaveBeenCalledWith('withdraw_reject', disb.id, [
      {
        account: expect.objectContaining({
          id: '00000000-0000-0000-0000-000000000010',
        }),
        amount: -disb.amount,
      },
      {
        account: expect.objectContaining({
          id: '11111111-1111-1111-1111-111111111111',
        }),
        amount: disb.amount,
      },
    ]);
  });
});
