import { BonusOptionEntity } from '../../src/database/entities/bonus-option.entity';
import { BonusDefaultsRequestSchema } from '../../src/schemas/bonus';

export function bonusEntities(): Partial<BonusOptionEntity>[] {
  return [
    { type: 'deposit', label: 'Deposit Match' },
    { type: 'rakeback', label: 'Rakeback' },
    { type: 'ticket', label: 'Tournament Tickets' },
    { type: 'rebate', label: 'Rebate' },
    { type: 'first-deposit', label: 'First Deposit Only' },
    { eligibility: 'all', label: 'All Players' },
    { eligibility: 'new', label: 'New Players Only' },
    { eligibility: 'vip', label: 'VIP Players Only' },
    { eligibility: 'active', label: 'Active Players' },
    { status: 'active', label: 'Active' },
    { status: 'paused', label: 'Paused' },
  ];
}

export function expectedOptions() {
  return {
    types: [
      { value: 'deposit', label: 'Deposit Match' },
      { value: 'rakeback', label: 'Rakeback' },
      { value: 'ticket', label: 'Tournament Tickets' },
      { value: 'rebate', label: 'Rebate' },
      { value: 'first-deposit', label: 'First Deposit Only' },
    ],
    eligibilities: [
      { value: 'all', label: 'All Players' },
      { value: 'new', label: 'New Players Only' },
      { value: 'vip', label: 'VIP Players Only' },
      { value: 'active', label: 'Active Players' },
    ],
    statuses: [
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
    ],
  };
}

export function expectedDefaults() {
  return BonusDefaultsRequestSchema.parse({
    name: '',
    type: 'deposit',
    description: '',
    bonusPercent: undefined,
    maxBonusUsd: undefined,
    expiryDate: undefined,
    eligibility: 'all',
    status: 'active',
  });
}

export function defaultsRequest() {
  return expectedDefaults();
}

export function updatedDefaultsRequest() {
  return BonusDefaultsRequestSchema.parse({
    name: 'VIP Boost',
    type: 'rakeback',
    description: 'Weekly rakeback boost',
    bonusPercent: 15,
    maxBonusUsd: 250,
    expiryDate: '2025-12-31',
    eligibility: 'vip',
    status: 'paused',
  });
}
