import { Injectable } from '@nestjs/common';

@Injectable()
export class KycAmlService {
  async isAllowed(userId: string): Promise<boolean> {
    // Placeholder for real KYC/AML integration
    return true;
  }
}

