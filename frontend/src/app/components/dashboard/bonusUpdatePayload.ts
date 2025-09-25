import type { BonusUpdatePayload } from '@shared/types';
import type { BonusFormValues } from './BonusManager';

export const buildBonusUpdatePayload = (
  data: BonusFormValues,
): BonusUpdatePayload => ({
  name: data.name,
  type: data.type,
  description: data.description,
  bonusPercent: data.bonusPercent ?? undefined,
  maxBonusUsd: data.maxBonusUsd ?? undefined,
  expiryDate: data.expiryDate || undefined,
  eligibility: data.eligibility,
  status: data.status,
});

export type { BonusUpdatePayload };
