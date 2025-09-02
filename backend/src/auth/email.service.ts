import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendResetCode(email: string, code: string): Promise<void> {
    // integration with real email provider goes here
    return;
  }
}
