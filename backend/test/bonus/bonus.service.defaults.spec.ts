import { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { BonusService } from '../../src/services/bonus.service';
import { BonusOptionEntity } from '../../src/database/entities/bonus-option.entity';
import { BonusEntity } from '../../src/database/entities/bonus.entity';
import { BonusDefaultEntity } from '../../src/database/entities/bonus-default.entity';
import { Transaction } from '../../src/wallet/transaction.entity';
import { defaultsRequest } from './fixtures';

describe('BonusService.createDefaults', () => {
  it('persists shared default columns via repository', async () => {
    const payload = defaultsRequest();

    const defaultsRepo = {
      count: jest.fn().mockResolvedValue(0),
      create: jest
        .fn()
        .mockImplementation((input) => Object.assign(new BonusDefaultEntity(), input)),
      save: jest.fn(async (entity) => entity),
    } as Partial<Repository<BonusDefaultEntity>>;

    const service = new BonusService(
      {} as Repository<BonusOptionEntity>,
      {} as Repository<BonusEntity>,
      defaultsRepo as Repository<BonusDefaultEntity>,
      {} as Repository<Transaction>,
      { get: jest.fn() } as unknown as ConfigService,
    );

    await expect(service.createDefaults(payload)).resolves.toEqual(payload);

    expect(defaultsRepo.count).toHaveBeenCalledTimes(1);
    expect(defaultsRepo.create).toHaveBeenCalledWith({
      name: payload.name,
      type: payload.type,
      description: payload.description,
      bonusPercent: null,
      maxBonusUsd: null,
      expiryDate: null,
      eligibility: payload.eligibility,
      status: payload.status,
    });

    const createMock = defaultsRepo.create as jest.Mock;
    const createdEntity = createMock.mock.results[0]?.value as BonusDefaultEntity;
    expect(createdEntity).toBeInstanceOf(BonusDefaultEntity);

    expect(defaultsRepo.save).toHaveBeenCalledWith(createdEntity);
    expect(defaultsRepo.save).toHaveBeenCalledTimes(1);
    expect(createdEntity).toMatchObject({
      name: payload.name,
      type: payload.type,
      description: payload.description,
      bonusPercent: null,
      maxBonusUsd: null,
      expiryDate: null,
      eligibility: payload.eligibility,
      status: payload.status,
    });
  });
});
