import fc from 'fast-check';

export const reserveOperationArb = fc.record({
  type: fc.constant<'reserve'>('reserve'),
  amount: fc.integer({ min: 1, max: 100 }),
  ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
});

export const rollbackOperationArb = fc.record({
  type: fc.constant<'rollback'>('rollback'),
  amount: fc.integer({ min: 1, max: 100 }),
  ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
});

export const commitOperationArb = fc
  .integer({ min: 1, max: 100 })
  .chain((amount) =>
    fc.record({
      type: fc.constant<'commit'>('commit'),
      amount: fc.constant(amount),
      rake: fc.integer({ min: 0, max: amount }),
      ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
    }),
  );

export const walletOperationArb = fc.oneof(
  reserveOperationArb,
  commitOperationArb,
  rollbackOperationArb,
);

export const walletTransactionArb = fc
  .integer({ min: 1, max: 100 })
  .chain((amount) =>
    fc.record({
      amount: fc.constant(amount),
      rake: fc.integer({ min: 0, max: amount }),
    }),
  );
