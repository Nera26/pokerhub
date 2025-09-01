import { Controller, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { WalletService } from './wallet.service';
import { PaymentProviderService } from './payment-provider.service';
import { ProviderCallbackSchema, type ProviderCallback } from '../schemas/wallet';

@Controller('wallet/provider')
export class WebhookController {
  constructor(
    private readonly wallet: WalletService,
    private readonly provider: PaymentProviderService,
  ) {
    this.provider.registerHandler('disbursement', (event) =>
      this.wallet.processDisbursement(
        event.eventId,
        event.idempotencyKey,
        event.providerTxnId,
        event.status,
      ),
    );
    void this.provider.drainQueue();
  }

  @Post('callback')
  async callback(@Req() req: Request, @Body() body: ProviderCallback) {
    const payload = JSON.stringify(body);
    const signature = req.headers['x-provider-signature'] as string;
    if (!signature || !this.provider.verifySignature(payload, signature)) {
      throw new UnauthorizedException('invalid signature');
    }
    const parsed = ProviderCallbackSchema.parse(body);
    await this.provider.handleWebhook(parsed, 'disbursement');
    return { message: 'acknowledged' };
  }
}
