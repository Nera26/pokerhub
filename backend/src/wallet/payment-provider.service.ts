import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export type ProviderStatus = 'approved' | 'risky' | 'chargeback';

export interface ProviderChallenge {
  id: string;
}

@Injectable()
export class PaymentProviderService {
  async initiate3DS(
    _accountId: string,
    _amount: number,
  ): Promise<ProviderChallenge> {
    // In production this would call the external payment provider.
    return { id: randomUUID() };
  }

  async getStatus(_id: string): Promise<ProviderStatus> {
    // Real implementation would query the provider for final status.
    return 'approved';
  }
}
