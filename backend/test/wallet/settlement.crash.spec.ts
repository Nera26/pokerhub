import { DataSource } from 'typeorm';
import { createDataSource } from '../utils/pgMem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import type { Street } from '../../src/game/state-machine';
import { createWalletServices } from './test-utils';
import { walletAccounts } from './fixtures';

describe('Settlement crash recovery', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createDataSource([
      Account,
      JournalEntry,
      Disbursement,
      SettlementJournal,
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  const userId = '11111111-1111-1111-1111-111111111111';
  const street: Street = 'flop';

  function createServices() {
    const { service: walletSvc, settleSvc: settlementSvc } =
      createWalletServices(dataSource);
    return { walletSvc, settlementSvc };
  }

  beforeEach(async () => {
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    await journalRepo.createQueryBuilder().delete().execute();
    await disbRepo.createQueryBuilder().delete().execute();
    await settleRepo.createQueryBuilder().delete().execute();
    await accountRepo.createQueryBuilder().delete().execute();
    await accountRepo.save(walletAccounts);
  });

  it('retries commit after crash without double settlement', async () => {
    const tx = 'h1#flop#1';
    const idem = tx;
    const { walletSvc } = createServices();
    await walletSvc.reserve(userId, 100, tx, 'USD', idem);

    // simulate crash by creating new service instances
    const { walletSvc: wallet2, settlementSvc: settle2 } = createServices();

    await settle2.commit('h1', street, 1);
    await settle2.commit('h1', street, 1);
    await wallet2.commit(tx, 100, 5, 'USD', idem);
    await wallet2.commit(tx, 100, 5, 'USD', idem);

    const accounts = await dataSource.getRepository(Account).find();
    const sum = accounts.reduce((acc, a) => acc + a.balance, 0);
    const user = accounts.find((a) => a.id === userId);
    const reserve = accounts.find((a) => a.name === 'reserve');
    const prize = accounts.find((a) => a.name === 'prize');
    const rake = accounts.find((a) => a.name === 'rake');
    expect(user?.balance).toBe(900);
    expect(reserve?.balance).toBe(0);
    expect(prize?.balance).toBe(95);
    expect(rake?.balance).toBe(5);
    expect(sum).toBe(1000);
    const journals = await dataSource.getRepository(JournalEntry).find();
    expect(journals).toHaveLength(5);
    const entry = await dataSource
      .getRepository(SettlementJournal)
      .findOneByOrFail({ idempotencyKey: idem });
    expect(entry.status).toBe('committed');
  });

  it('retries cancel after crash without double settlement', async () => {
    const tx = 'h2#flop#1';
    const idem = tx;
    const { walletSvc } = createServices();
    await walletSvc.reserve(userId, 100, tx, 'USD', idem);

    const { walletSvc: wallet2, settlementSvc: settle2 } = createServices();
    await settle2.cancel('h2', street, 1);
    await settle2.cancel('h2', street, 1);
    await wallet2.rollback(userId, 100, tx, 'USD', idem);
    await wallet2.rollback(userId, 100, tx, 'USD', idem);

    const accounts = await dataSource.getRepository(Account).find();
    const sum = accounts.reduce((acc, a) => acc + a.balance, 0);
    const user = accounts.find((a) => a.id === userId);
    const reserve = accounts.find((a) => a.name === 'reserve');
    expect(user?.balance).toBe(1000);
    expect(reserve?.balance).toBe(0);
    expect(sum).toBe(1000);
    const journals = await dataSource.getRepository(JournalEntry).find();
    expect(journals).toHaveLength(4);
    const entries = await dataSource.getRepository(SettlementJournal).find();
    expect(entries).toHaveLength(0);
  });
});

