import { Controller, Post, Param, Body, Req } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import type { Request } from 'express';
import {
  WithdrawSchema,
  type WithdrawRequest,
  ProviderCallbackSchema,
  type ProviderCallback,
} from '../schemas/wallet';

interface TxDto {
  amount: number;
  tx: string;
  rake?: number;
}

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Post(':id/reserve')
  async reserve(@Param('id') id: string, @Body() body: TxDto) {
    await this.wallet.reserve(id, body.amount, body.tx);
    return { message: 'reserved' };
  }

  @Post(':id/commit')
  async commit(@Param('id') id: string, @Body() body: TxDto) {
    await this.wallet.commit(body.tx, body.amount, body.rake ?? 0);
    return { message: 'committed' };
  }

  @Post(':id/rollback')
  async rollback(@Param('id') id: string, @Body() body: TxDto) {
    await this.wallet.rollback(id, body.amount, body.tx);
    return { message: 'rolled back' };
  }

  @Post(':id/withdraw')
  async withdraw(
    @Param('id') id: string,
    @Body() body: WithdrawRequest,
    @Req() req: Request,
  ) {
    const parsed = WithdrawSchema.parse(body);
    await this.wallet.withdraw(id, parsed.amount, parsed.deviceId, req.ip);
    return { message: 'withdrawn' };
  }

  @Post('provider/callback')
  async providerCallback(@Body() body: ProviderCallback) {
    const parsed = ProviderCallbackSchema.parse(body);
    await this.wallet.handleProviderCallback(parsed.idempotencyKey);
    return { message: 'acknowledged' };
  }
}
