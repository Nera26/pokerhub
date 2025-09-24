import type { BonusFormValues } from './BonusManager';

export const buildBonusUpdatePayload = (data: BonusFormValues) => ({
  ...data,
  expiryDate: data.expiryDate || undefined,
});

export type BonusUpdatePayload = ReturnType<typeof buildBonusUpdatePayload>;
