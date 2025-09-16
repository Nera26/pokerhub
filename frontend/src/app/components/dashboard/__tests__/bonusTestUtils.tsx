import BonusManager from '../BonusManager';
import { renderWithClient } from './renderWithClient';
import { fetchBonuses, updateBonus, fetchBonusOptions } from '@/lib/api/admin';
import { fetchBonusDefaults } from '@/lib/api/bonus';
import type { Bonus } from '@/lib/api/admin';

export const bonusFixture: Bonus = {
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
};

export function mockFetchBonuses(bonuses: Bonus[]) {
  let current = bonuses;
  (fetchBonuses as jest.Mock).mockImplementation(() =>
    Promise.resolve(current),
  );
  (updateBonus as jest.Mock).mockImplementation(
    (id: number, data: Partial<Bonus>) => {
      current = current.map((b) => (b.id === id ? { ...b, ...data } : b));
      return Promise.resolve({});
    },
  );
}

export function renderBonusManager() {
  (fetchBonusOptions as jest.Mock).mockResolvedValue({
    types: [{ value: 'deposit', label: 'Deposit Match' }],
    eligibilities: [{ value: 'all', label: 'All Players' }],
    statuses: [
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
    ],
  });
  (fetchBonusDefaults as jest.Mock).mockResolvedValue({
    name: '',
    type: 'deposit',
    description: '',
    bonusPercent: undefined,
    maxBonusUsd: undefined,
    expiryDate: '',
    eligibility: 'all',
    status: 'active',
  });
  return renderWithClient(<BonusManager />);
}
