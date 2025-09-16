import { applyOperation } from '../apply-operations';
import type { Accounts, Operation } from '../apply-operations';
import {
  USER_ID,
  seedDefaultAccounts,
  setupFlow,
} from '../flow-test-utils';
import type { FlowTestContext } from '../flow-test-utils';

export interface SequenceRunner extends FlowTestContext {
  accounts: Accounts;
  apply(): Promise<void>;
  cleanup(): Promise<void>;
  total(): number;
}

type OperationInput =
  | ReadonlyArray<Operation>
  | ReadonlyArray<ReadonlyArray<Operation>>;

function isBatchArray(
  ops: OperationInput,
): ops is ReadonlyArray<ReadonlyArray<Operation>> {
  return (
    ops.length > 0 &&
    Array.isArray((ops as ReadonlyArray<ReadonlyArray<Operation>>)[0])
  );
}

function normalizeOps(ops: OperationInput): Operation[][] {
  if (ops.length === 0) {
    return [];
  }

  if (isBatchArray(ops)) {
    return ops.map((batch) => [...batch]);
  }

  return ops.map((op) => [op]);
}

function computeTotal(accounts: Accounts): number {
  return (
    accounts.user.balance +
    accounts.reserve.balance +
    accounts.house.balance +
    accounts.rake.balance +
    accounts.prize.balance
  );
}

export async function runSequence(ops: OperationInput): Promise<SequenceRunner> {
  const context = await setupFlow();
  const accounts = await seedDefaultAccounts(context.accountRepo);
  const batches = normalizeOps(ops);

  const apply = async () => {
    for (const batch of batches) {
      await Promise.all(
        batch.map((op) => applyOperation(context.service, accounts, USER_ID, op)),
      );
    }
  };

  const cleanup = async () => {
    await context.dataSource.destroy();
  };

  return {
    ...context,
    accounts,
    apply,
    cleanup,
    total: () => computeTotal(accounts),
  };
}
