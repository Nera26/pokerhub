import { ChipDenomsService } from '../src/services/chip-denoms.service';
import { CHIP_DENOMS } from '@shared/config/chipDenoms';

describe('ChipDenomsService', () => {
  it('gets and updates chip denominations', () => {
    const service = new ChipDenomsService();
    expect(service.get()).toEqual(CHIP_DENOMS);
    const updated = service.update([500, 100, 25]);
    expect(updated).toEqual([500, 100, 25]);
    expect(service.get()).toEqual([500, 100, 25]);
  });
});
