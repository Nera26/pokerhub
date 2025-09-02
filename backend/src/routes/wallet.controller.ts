import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  Get,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { AuthGuard } from '../auth/auth.guard';
import { WalletService } from '../wallet/wallet.service';
import { KycService } from '../wallet/kyc.service';
import type { Request } from 'express';
import {
  WithdrawSchema,
  type WithdrawRequest,
  DepositSchema,
  type DepositRequest,
  WalletStatusSchema,
  type WalletStatusResponse,
  WalletTransactionsResponseSchema,
  PendingTransactionsResponseSchema,
  type WalletTransactionsResponse,
  type PendingTransactionsResponse,
} from '../schemas/wallet';

interface TxDto {
  amount: number;
  tx: string;
  rake?: number;
  currency: string;
}

@UseGuards(AuthGuard, RateLimitGuard)
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly kyc: KycService,
  ) {}

  private ensureOwner(req: Request, id: string) {
    if (req.userId !== id) {
      throw new ForbiddenException();
    }
  }

  @Post(':id/reserve')
  async reserve(
    @Param('id') id: string,
    @Body() body: TxDto,
    @Req() req: Request,
  ) {
    this.ensureOwner(req, id);
    await this.wallet.reserve(id, body.amount, body.tx, body.currency);
    return { message: 'reserved' };
  }

  @Post(':id/commit')
  async commit(
    @Param('id') id: string,
    @Body() body: TxDto,
    @Req() req: Request,
  ) {
    this.ensureOwner(req, id);
    await this.wallet.commit(body.tx, body.amount, body.rake ?? 0, body.currency);
    return { message: 'committed' };
  }

  @Post(':id/rollback')
  async rollback(
    @Param('id') id: string,
    @Body() body: TxDto,
    @Req() req: Request,
  ) {
    this.ensureOwner(req, id);
    await this.wallet.rollback(id, body.amount, body.tx, body.currency);
    return { message: 'rolled back' };
  }

  @Post(':id/withdraw')
  async withdraw(
    @Param('id') id: string,
    @Body() body: WithdrawRequest,
    @Req() req: Request,
  ) {
    this.ensureOwner(req, id);
    const parsed = WithdrawSchema.parse(body);
    await this.wallet.withdraw(id, parsed.amount, parsed.deviceId, req.ip, parsed.currency);
    return { message: 'withdrawn' };
  }

  @Post(':id/deposit')
  async deposit(
    @Param('id') id: string,
    @Body() body: DepositRequest,
    @Req() req: Request,
  ) {
    this.ensureOwner(req, id);
    const parsed = DepositSchema.parse(body);
    const challenge = await this.wallet.deposit(
      id,
      parsed.amount,
      parsed.deviceId,
      req.ip,
      parsed.currency,
    );
    return challenge;
  }

  @Post(':id/kyc')
  async verify(@Param('id') id: string, @Req() req: Request) {
    this.ensureOwner(req, id);
    await this.kyc.verify(id);
    return { message: 'verified' };
  }

  @Get(':id/status')
  async status(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<WalletStatusResponse> {
    this.ensureOwner(req, id);
    const res = await this.wallet.status(id);
    return WalletStatusSchema.parse(res);
  }

  @Get(':id/transactions')
  async transactions(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<WalletTransactionsResponse> {
    this.ensureOwner(req, id);
    const res = await this.wallet.transactions(id);
    return WalletTransactionsResponseSchema.parse(res);
  }

  @Get(':id/pending')
  async pending(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<PendingTransactionsResponse> {
    this.ensureOwner(req, id);
    const res = await this.wallet.pending(id);
    return PendingTransactionsResponseSchema.parse(res);
  }
}
