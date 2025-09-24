import BonusManager from '../BonusManager';
import { renderWithClient } from './renderWithClient';
import { fetchBonuses, updateBonus, fetchBonusOptions } from '@/lib/api/admin';
import { fetchBonusDefaults, fetchBonusStats } from '@/lib/api/bonus';
import type { Bonus } from '@/lib/api/admin';
import {
  BonusSchema,
  BonusesResponseSchema,
  BonusDefaultsResponseSchema,
  BonusOptionsResponseSchema,
  BonusUpdateRequestSchema,
  BonusStatsResponseSchema,
} from '@shared/types';
import type { BonusDefaultsResponse } from '@shared/types';

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

export const bonusDefaultsFixture: BonusDefaultsResponse =
  BonusDefaultsResponseSchema.parse({
    name: '',
    type: 'deposit',
    description: '',
    bonusPercent: undefined,
    maxBonusUsd: undefined,
    expiryDate: undefined,
    eligibility: 'all',
    status: 'active',
  });

export function mockFetchBonuses(bonuses: Bonus[]) {
  let current = BonusesResponseSchema.parse(bonuses);
  (fetchBonuses as jest.Mock).mockImplementation(() =>
    Promise.resolve(current),
  );
  (fetchBonusStats as jest.Mock).mockImplementation(() => {
    const activeBonuses = current.filter((b) => b.status === 'active').length;
    const weeklyClaims = current.reduce(
      (total, bonus) => total + (bonus.claimsWeek ?? 0),
      0,
    );
    return Promise.resolve(
      BonusStatsResponseSchema.parse({
        activeBonuses,
        weeklyClaims,
        completedPayouts: 0,
        currency: 'USD',
        conversionRate: 0,
      }),
    );
  });
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

export function renderBonusManager({
  defaults = bonusDefaultsFixture,
  defaultsSequence,
}: {
  defaults?: BonusDefaultsResponse;
  defaultsSequence?: BonusDefaultsResponse[];
} = {}) {
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

  if (defaultsSequence?.length) {
    const parsedSequence = defaultsSequence.map((entry) =>
      BonusDefaultsResponseSchema.parse(entry),
    );
    let index = 0;
    (fetchBonusDefaults as jest.Mock).mockImplementation(() => {
      const value = parsedSequence[Math.min(index, parsedSequence.length - 1)];
      index += 1;
      return Promise.resolve(value);
    });
  } else {
    (fetchBonusDefaults as jest.Mock).mockResolvedValue(
      BonusDefaultsResponseSchema.parse(defaults),
    );
  }

  // Provide a safe default for stats if nothing else mocked yet.
  if (!(fetchBonusStats as jest.Mock).getMockImplementation()) {
    (fetchBonusStats as jest.Mock).mockResolvedValue(
      BonusStatsResponseSchema.parse({
        activeBonuses: 0,
        weeklyClaims: 0,
        completedPayouts: 0,
        currency: 'USD',
        conversionRate: 0,
      }),
    );
  }

  return renderWithClient(<BonusManager />);
}
