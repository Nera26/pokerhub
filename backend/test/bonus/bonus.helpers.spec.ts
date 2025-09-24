import { mapBonusDefaults, mapBonusEntity, toBonusDefaultsInput, toBonusEntityInput } from '../../src/services/bonus.helpers';
import { BonusEntity } from '../../src/database/entities/bonus.entity';
import { BonusDefaultEntity } from '../../src/database/entities/bonus-default.entity';
import { expectedDefaults, updatedDefaultsRequest } from './fixtures';

function createBonusEntity(): BonusEntity {
  return Object.assign(new BonusEntity(), {
    id: 1,
    name: 'Reload Boost',
    type: 'deposit',
    description: 'Match your reloads',
    bonusPercent: 50,
    maxBonusUsd: 200,
    expiryDate: '2025-01-01',
    eligibility: 'all',
    status: 'active',
    claimsTotal: 3,
    claimsWeek: 2,
  });
}

describe('bonus helpers', () => {
  it('maps bonus entities to response shape', () => {
    const entity = createBonusEntity();
    const mapped = mapBonusEntity(entity);

    expect(mapped).toEqual({
      id: 1,
      name: 'Reload Boost',
      type: 'deposit',
      description: 'Match your reloads',
      bonusPercent: 50,
      maxBonusUsd: 200,
      expiryDate: '2025-01-01',
      eligibility: 'all',
      status: 'active',
      claimsTotal: 3,
      claimsWeek: 2,
    });
  });

  it('normalizes bonus payloads for persistence', () => {
    const input = toBonusEntityInput({
      name: 'VIP Bonus',
      type: 'rebate',
      description: 'VIP rebate',
      bonusPercent: undefined,
      maxBonusUsd: 150,
      expiryDate: null,
      eligibility: 'vip',
      status: 'paused',
      claimsTotal: 5,
      claimsWeek: 1,
    });

    expect(input).toEqual({
      name: 'VIP Bonus',
      type: 'rebate',
      description: 'VIP rebate',
      bonusPercent: null,
      maxBonusUsd: 150,
      expiryDate: null,
      eligibility: 'vip',
      status: 'paused',
      claimsTotal: 5,
      claimsWeek: 1,
    });
  });

  it('returns fallback defaults when entity missing', () => {
    const defaults = expectedDefaults();
    const mapped = mapBonusDefaults(null, defaults);

    expect(mapped).toEqual(defaults);
    expect(mapped).not.toBe(defaults);
  });

  it('maps stored defaults entities to response shape', () => {
    const defaults = updatedDefaultsRequest();
    const entity = Object.assign(new BonusDefaultEntity(), {
      id: 1,
      ...defaults,
    });

    expect(mapBonusDefaults(entity, expectedDefaults())).toEqual(defaults);
  });

  it('prepares defaults payloads for persistence', () => {
    const request = updatedDefaultsRequest();
    const payload = toBonusDefaultsInput(request);

    expect(payload).toEqual({
      name: 'VIP Boost',
      type: 'rakeback',
      description: 'Weekly rakeback boost',
      bonusPercent: 15,
      maxBonusUsd: 250,
      expiryDate: '2025-12-31',
      eligibility: 'vip',
      status: 'paused',
    });
  });
});
