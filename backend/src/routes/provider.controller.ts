import { Controller, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { WalletService } from '../wallet/wallet.service';
import { PaymentProviderService } from '../wallet/payment-provider.service';
import {
  ProviderCallbackSchema,
  type ProviderCallback,
} from '../schemas/wallet';

@Controller('wallet/provider')
export class ProviderController {
  constructor(
    private readonly wallet: WalletService,
    private readonly provider: PaymentProviderService,
  ) {}

  @Post('callback')
  async callback(@Req() req: Request, @Body() body: ProviderCallback) {
    const payload = JSON.stringify(body);
    const signature = req.headers['x-provider-signature'] as string;
    if (!signature || !this.provider.verifySignature(payload, signature)) {
      throw new UnauthorizedException('invalid signature');
    }
    const parsed = ProviderCallbackSchema.parse(body);
    await this.wallet.handleProviderCallback(
      parsed.idempotencyKey,
      parsed.providerTxnId,
      parsed.status,
    );
    return { message: 'acknowledged' };
  }
}
