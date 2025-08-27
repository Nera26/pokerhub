import { Controller, Post, Param, Body } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';

interface AmountDto {
  amount: number;
}

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

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
}
