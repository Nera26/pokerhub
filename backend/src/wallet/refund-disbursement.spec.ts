import { WalletService } from './wallet.service';
import { Account } from './account.entity';
import { Disbursement } from './disbursement.entity';

describe('WalletService.refundDisbursement', () => {
  it('records refund from house to user', async () => {
    const accounts: any = { findOneByOrFail: jest.fn() };
    const wallet = new WalletService(
      accounts,
      {} as any,
      {} as any,
      {} as any,
      { emit: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const user: Account = { id: 'u', currency: 'USD' } as any;
    const house: Account = { id: 'h', name: 'house', currency: 'USD' } as any;
    accounts.findOneByOrFail
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(house);
    (wallet as any).record = jest.fn();
    const disb: Disbursement = {
      id: 'd',
      accountId: 'u',
      amount: 100,
      idempotencyKey: 'k',
      status: 'pending',
      createdAt: new Date(),
    } as any;
    await wallet.refundDisbursement(disb);
    expect((wallet as any).record).toHaveBeenCalledWith('withdraw_reject', disb.id, [
      { account: house, amount: -disb.amount },
      { account: user, amount: disb.amount },
    ]);
  });
});
