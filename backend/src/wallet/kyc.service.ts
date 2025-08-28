import { Injectable } from '@nestjs/common';
import { Account } from './account.entity';

@Injectable()
export class KycService {
  async validate(account: Account): Promise<void> {
    if (!account.kycVerified) {
      throw new Error('KYC required');
    }
    if (!account.name) {
      throw new Error('Account missing required fields');
    }
  }
}
