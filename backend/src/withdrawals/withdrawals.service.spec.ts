import { WithdrawalsService } from './withdrawals.service';
import { Repository } from 'typeorm';
import { WithdrawalDecision } from './withdrawal-decision.entity';
import { Disbursement } from '../wallet/disbursement.entity';
import { WalletService } from '../wallet/wallet.service';


describe('WithdrawalsService.reject', () => {
  it('refunds pending disbursement and deletes it', async () => {
    const decisions: Partial<Repository<WithdrawalDecision>> = {
      save: jest.fn(),
    };
    const disb: Disbursement = {
      id: 'd1',
      accountId: 'u1',
      amount: 50,
      idempotencyKey: 'k',
      status: 'pending',
      createdAt: new Date(),
    } as any;
    const disbursements: Partial<Repository<Disbursement>> = {
      findOne: jest.fn().mockResolvedValue(disb),
      delete: jest.fn(),
    };
    const accounts: any = {};
    const wallet: Partial<WalletService> = {
      refundDisbursement: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WithdrawalsService(
      decisions as Repository<WithdrawalDecision>,
      disbursements as Repository<Disbursement>,
      accounts,
      wallet as WalletService,
    );

    await service.reject('u1', 'rev', 'bad');

    expect(decisions.save).toHaveBeenCalledWith({
      userId: 'u1',
      reviewerId: 'rev',
      comment: 'bad',
      status: 'rejected',
    });
    expect(wallet.refundDisbursement).toHaveBeenCalledWith(disb);
    expect(disbursements.delete).toHaveBeenCalledWith(disb.id);
  });

  it('skips refund when no pending disbursement', async () => {
    const decisions: any = { save: jest.fn() };
    const disbursements: any = {
      findOne: jest.fn().mockResolvedValue(null),
      delete: jest.fn(),
    };
    const wallet: any = { refundDisbursement: jest.fn() };
    const service = new WithdrawalsService(
      decisions,
      disbursements,
      {} as any,
      wallet,
    );

    await service.reject('u1', 'rev', 'bad');

    expect(wallet.refundDisbursement).not.toHaveBeenCalled();
    expect(disbursements.delete).not.toHaveBeenCalled();
  });
});
