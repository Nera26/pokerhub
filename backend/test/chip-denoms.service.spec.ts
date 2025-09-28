import type { Repository } from 'typeorm';
import { ChipDenominationEntity } from '../src/database/entities/chip-denomination.entity';
import { ChipDenomsService } from '../src/services/chip-denoms.service';

describe('ChipDenomsService', () => {
  it('gets and updates chip denominations', async () => {
    const find = jest
      .fn()
      .mockResolvedValueOnce([
        { value: 1000 },
        { value: 500 },
        { value: 100 },
      ])
      .mockResolvedValueOnce([
        { value: 500 },
        { value: 100 },
        { value: 25 },
      ]);
    const repo = {
      find,
      clear: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    } satisfies Pick<Repository<ChipDenominationEntity>, 'find' | 'clear' | 'insert'>;

    const service = new ChipDenomsService(
      repo as unknown as Repository<ChipDenominationEntity>,
    );

    await expect(service.get()).resolves.toEqual([1000, 500, 100]);

    const updated = await service.update([500, 100, 25]);
    expect(updated).toEqual([500, 100, 25]);

    expect(repo.clear).toHaveBeenCalledTimes(1);
    expect(repo.insert).toHaveBeenCalledWith([
      { value: 500 },
      { value: 100 },
      { value: 25 },
    ]);
    expect(find).toHaveBeenCalledTimes(2);
  });
});
