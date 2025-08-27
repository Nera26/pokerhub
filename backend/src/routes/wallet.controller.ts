import { Controller, Post, Param, Body } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';

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
}
