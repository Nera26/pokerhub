import BonusManager from '../BonusManager';
import { renderWithClient } from './renderWithClient';
import { fetchBonuses, updateBonus, fetchBonusOptions } from '@/lib/api/admin';
import { fetchBonusDefaults } from '@/lib/api/bonus';
import type { Bonus } from '@/lib/api/admin';
import {
  BonusSchema,
  BonusesResponseSchema,
  BonusDefaultsResponseSchema,
  BonusOptionsResponseSchema,
  BonusUpdateRequestSchema,
} from '@shared/types';

export const bonusFixture: Bonus = BonusSchema.parse({
  id: 1,
  name: 'Test Bonus',
  type: 'deposit',
  description: 'desc',
  bonusPercent: 10,
  maxBonusUsd: 100,
  expiryDate: undefined,
  eligibility: 'all',
  status: 'active',
  claimsTotal: 0,
  claimsWeek: 0,
});

export function mockFetchBonuses(bonuses: Bonus[]) {
  let current = BonusesResponseSchema.parse(bonuses);
  (fetchBonuses as jest.Mock).mockImplementation(() =>
    Promise.resolve(current),
  );
  (updateBonus as jest.Mock).mockImplementation((id: number, data) => {
    const parsed = BonusUpdateRequestSchema.parse(data);
    const next = current.map((b) => {
      if (b.id !== id) return b;
      return BonusSchema.parse({ ...b, ...parsed });
    });
    current = next;
    return Promise.resolve(current.find((b) => b.id === id));
  });
}

export function renderBonusManager() {
  (fetchBonusOptions as jest.Mock).mockResolvedValue(
    BonusOptionsResponseSchema.parse({
      types: [{ value: 'deposit', label: 'Deposit Match' }],
      eligibilities: [{ value: 'all', label: 'All Players' }],
      statuses: [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
      ],
    }),
  );
  (fetchBonusDefaults as jest.Mock).mockResolvedValue(
    BonusDefaultsResponseSchema.parse({
      name: '',
      type: 'deposit',
      description: '',
      bonusPercent: undefined,
      maxBonusUsd: undefined,
      expiryDate: '',
      eligibility: 'all',
      status: 'active',
    }),
  );
  return renderWithClient(<BonusManager />);
}
