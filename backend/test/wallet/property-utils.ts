import { createWalletTestContext, seedWalletAccounts } from './test-utils';
export {
  reserveOperationArb as reserveArb,
  rollbackOperationArb as rollbackArb,
  commitOperationArb as commitArb,
  walletOperationArb as opArb,
} from './arbitraries';

export const USER_ID = '11111111-1111-1111-1111-111111111111';

export async function setupPropertyTest() {
  const { dataSource, service, repos } = await createWalletTestContext();
  await seedWalletAccounts(repos.account);
  return {
    dataSource,
    service,
    accountRepo: repos.account,
    journalRepo: repos.journal,
    disbRepo: repos.disbursement,
    settleRepo: repos.settlement,
    pendingRepo: repos.pending,
  };
}
