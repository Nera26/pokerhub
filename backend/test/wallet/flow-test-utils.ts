import { DataSource, Repository } from 'typeorm';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { createWalletTestContext } from './test-utils';

export const USER_ID = '11111111-1111-1111-1111-111111111111';

export interface FlowTestContext {
  dataSource: DataSource;
  service: WalletService;
  accountRepo: Repository<Account>;
  journalRepo: Repository<JournalEntry>;
  disbRepo: Repository<Disbursement>;
  settleRepo: Repository<SettlementJournal>;
}

export async function createFlowTestContext(): Promise<FlowTestContext> {
  const { dataSource, service, repos } = await createWalletTestContext();
  return {
    dataSource,
    service,
    accountRepo: repos.account,
    journalRepo: repos.journal,
    disbRepo: repos.disbursement,
    settleRepo: repos.settlement,
  };
}

export async function setupFlow(): Promise<FlowTestContext> {
  return createFlowTestContext();
}

export async function seedDefaultAccounts(accountRepo: Repository<Account>) {
  await accountRepo.save([
    { id: USER_ID, name: 'user', balance: 0, kycVerified: true, currency: 'USD' },
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'reserve',
      balance: 0,
      kycVerified: false,
      currency: 'USD',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'house',
      balance: 0,
      kycVerified: false,
      currency: 'USD',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'rake',
      balance: 0,
      kycVerified: false,
      currency: 'USD',
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'prize',
      balance: 0,
      kycVerified: false,
      currency: 'USD',
    },
  ]);
  return {
    user: await accountRepo.findOneByOrFail({ id: USER_ID }),
    reserve: await accountRepo.findOneByOrFail({ name: 'reserve' }),
    house: await accountRepo.findOneByOrFail({ name: 'house' }),
    rake: await accountRepo.findOneByOrFail({ name: 'rake' }),
    prize: await accountRepo.findOneByOrFail({ name: 'prize' }),
  };
}

export async function seedAccounts(
  accountRepo: Repository<Account>,
  accountIds: string[],
) {
  await accountRepo.save(
    accountIds.map((id) => ({ id, name: id, balance: 0, currency: 'USD' })),
  );
  return new Map((await accountRepo.find()).map((a) => [a.id, a]));
}

