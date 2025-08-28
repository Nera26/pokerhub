import { KycService } from './kyc.service';
import type { Repository } from 'typeorm';
import type { KycVerification } from '../database/entities/kycVerification.entity';
import type { Account } from '../wallet/account.entity';
import type { CountryProvider } from './providers/country-provider';

describe('KycService', () => {
  it('blocks users from restricted countries', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('IR'),
    };
    const service = new KycService(
      provider,
      {} as unknown as Repository<KycVerification>,
      {} as unknown as Repository<Account>,
    );
    await expect(service.runChecks('good', '1.1.1.1')).rejects.toThrow(
      'Blocked jurisdiction',
    );
  });

  it('blocks sanctioned names', async () => {
    const provider: CountryProvider = {
      getCountry: () => Promise.resolve('GB'),
    };
    const service = new KycService(
      provider,
      {} as unknown as Repository<KycVerification>,
      {} as unknown as Repository<Account>,
    );
    await expect(service.runChecks('Bad Actor', '1.1.1.1')).rejects.toThrow(
      'Sanctioned individual',
    );
  });
});
