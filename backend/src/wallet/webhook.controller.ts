import { Controller, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { WalletService } from './wallet.service';
import { PaymentProviderService } from './payment-provider.service';

@Controller('wallet/provider')
export class WebhookController {
  constructor(
    private readonly wallet: WalletService,
    private readonly provider: PaymentProviderService,
  ) {
    this.provider.registerHandler('3ds', (event) => this.wallet.confirm3DS(event));
    void this.provider.drainQueue();
  }

  @Post('callback')
  async callback(@Req() req: Request, @Body() body: unknown) {
    const payload = JSON.stringify(body);
    const signature = req.headers['x-provider-signature'] as string;
    if (!signature || !this.provider.verifySignature(payload, signature)) {
      throw new UnauthorizedException('invalid signature');
    }
    await this.provider.confirm3DS(body);
    return { message: 'acknowledged' };
  }
}
