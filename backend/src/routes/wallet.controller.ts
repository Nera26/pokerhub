import { Controller, Post, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { WalletService } from '../wallet/wallet.service';
import { KycAmlService } from '../wallet/kyc-aml.service';
import { RateLimitService } from '../wallet/rate-limit.service';

interface AmountDto {
  amount: number;
}

interface WithdrawDto extends AmountDto {
  deviceId: string;
}

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly kyc: KycAmlService,
    private readonly rateLimit: RateLimitService,
  ) {}

  @Post(':id/reserve')
  async reserve(@Param('id') id: string, @Body() body: AmountDto) {
    await this.wallet.reserve(id, body.amount);
    return { message: 'reserved' };
  }

  @Post(':id/commit')
  async commit(@Param('id') id: string, @Body() body: AmountDto) {
    await this.wallet.commit(id, body.amount);
    return { message: 'committed' };
  }

  @Post(':id/rollback')
  async rollback(@Param('id') id: string, @Body() body: AmountDto) {
    await this.wallet.rollback(id, body.amount);
    return { message: 'rolled back' };
  }

  @Post(':id/withdraw')
  async withdraw(
    @Param('id') id: string,
    @Body() body: WithdrawDto,
    @Req() req: Request,
  ) {
    const ip = req.ip;
    if (!(await this.kyc.isAllowed(id))) {
      throw new Error('KYC/AML verification failed');
    }
    await this.rateLimit.check(`withdraw:ip:${ip}`);
    await this.rateLimit.check(`withdraw:device:${body.deviceId}`);
    await this.wallet.withdraw(id, body.amount);
    return { message: 'withdrawn' };
  }
}
