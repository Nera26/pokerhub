import fc from 'fast-check';
import { createWalletTestContext, seedWalletAccounts } from './test-utils';

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

export const reserveArb = fc.record({
  type: fc.constant<'reserve'>('reserve'),
  amount: fc.integer({ min: 1, max: 100 }),
  ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
});

export const rollbackArb = fc.record({
  type: fc.constant<'rollback'>('rollback'),
  amount: fc.integer({ min: 1, max: 100 }),
  ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
});

export const commitArb = fc.integer({ min: 1, max: 100 }).chain((amount) =>
  fc.record({
    type: fc.constant<'commit'>('commit'),
    amount: fc.constant(amount),
    rake: fc.integer({ min: 0, max: amount }),
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
  }),
);

export const opArb = fc.oneof(reserveArb, rollbackArb, commitArb);
