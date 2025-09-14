import fc from 'fast-check';

const refArb = fc.hexaString({ minLength: 1, maxLength: 10 });
const idempotencyKeyArb = fc.hexaString({ minLength: 1, maxLength: 10 });

const intArb = (max = 1_000_000_000) => fc.integer({ min: 1, max });

export const depositArb = (max = 1_000_000_000) =>
  fc.record({
    type: fc.constant<'deposit'>('deposit'),
    amount: intArb(max),
    ref: refArb,
  });

export const withdrawArb = (max = 1_000_000_000) =>
  fc.record({
    type: fc.constant<'withdraw'>('withdraw'),
    amount: intArb(max),
    ref: refArb,
  });

export const reserveArb = (max = 1_000_000_000) =>
  intArb(max).chain((amount) =>
    fc.record({
      type: fc.constant<'reserve'>('reserve'),
      amount: fc.constant(amount),
      rake: fc.integer({ min: 0, max: amount }),
      ref: refArb,
      idempotencyKey: idempotencyKeyArb,
    }),
  );

export const reserveCommitArb = (max = 1_000_000_000) =>
  intArb(max).chain((amount) =>
    fc.record({
      type: fc.constant<'reserveCommit'>('reserveCommit'),
      amount: fc.constant(amount),
      rake: fc.integer({ min: 0, max: amount }),
      ref: refArb,
      idempotencyKey: idempotencyKeyArb,
    }),
  );

export const reserveRollbackArb = (max = 1_000_000_000) =>
  fc.record({
    type: fc.constant<'reserveRollback'>('reserveRollback'),
    amount: intArb(max),
    ref: refArb,
    idempotencyKey: idempotencyKeyArb,
  });

