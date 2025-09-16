export type ReserveOperation = {
  type: 'reserve';
  amount: number;
  ref: string;
};

export type CommitOperation = {
  type: 'commit';
  amount: number;
  rake: number;
  ref: string;
};

export type RollbackOperation = {
  type: 'rollback';
  amount: number;
  ref: string;
};

export type WalletOperation = ReserveOperation | CommitOperation | RollbackOperation;

export type MaybePromise<T> = T | Promise<T>;

export interface BalanceService {
  reserve(
    userId: string,
    amount: number,
    ref: string,
    currency: string,
  ): MaybePromise<unknown>;
  commit(ref: string, amount: number, rake: number, currency: string): MaybePromise<unknown>;
  rollback(
    userId: string,
    amount: number,
    ref: string,
    currency: string,
  ): MaybePromise<unknown>;
}

export interface AssertBalanceOptions {
  service: BalanceService;
  ops: WalletOperation[];
  userId: string;
  getBalance: (op: WalletOperation) => MaybePromise<number>;
  expected: number | ((op: WalletOperation) => MaybePromise<number>);
  currency?: string;
}

export async function assertBalance({
  service,
  ops,
  userId,
  getBalance,
  expected,
  currency = 'USD',
}: AssertBalanceOptions): Promise<void> {
  for (const op of ops) {
    await applyOperation(service, op, userId, currency);

    const [actual, expectedValue] = await Promise.all([
      Promise.resolve(getBalance(op)),
      typeof expected === 'function'
        ? Promise.resolve(expected(op))
        : Promise.resolve(expected),
    ]);

    expect(actual).toBe(expectedValue);
  }
}

async function applyOperation(
  service: BalanceService,
  op: WalletOperation,
  userId: string,
  currency: string,
): Promise<void> {
  switch (op.type) {
    case 'reserve':
      await service.reserve(userId, op.amount, op.ref, currency);
      return;
    case 'commit':
      await service.commit(op.ref, op.amount, op.rake, currency);
      return;
    case 'rollback':
      await service.rollback(userId, op.amount, op.ref, currency);
      return;
  }

  throw new Error(`Unsupported operation type: ${(op as { type?: unknown })?.type ?? 'unknown'}`);
}
