import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  Get,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ZodError } from 'zod';
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
  TxSchema,
  type TxRequest,
} from '../schemas/wallet';

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
    @Body() body: TxRequest,
    @Req() req: Request,
  ) {
    this.ensureOwner(req, id);
    try {
      const parsed = TxSchema.parse(body);
      await this.wallet.reserve(id, parsed.amount, parsed.tx, parsed.currency);
      return { message: 'reserved' };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post(':id/commit')
  async commit(
    @Param('id') id: string,
    @Body() body: TxRequest,
    @Req() req: Request,
  ) {
    this.ensureOwner(req, id);
    try {
      const parsed = TxSchema.parse(body);
      await this.wallet.commit(parsed.tx, parsed.amount, parsed.rake ?? 0, parsed.currency);
      return { message: 'committed' };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post(':id/rollback')
  async rollback(
    @Param('id') id: string,
    @Body() body: TxRequest,
    @Req() req: Request,
  ) {
    this.ensureOwner(req, id);
    try {
      const parsed = TxSchema.parse(body);
      await this.wallet.rollback(id, parsed.amount, parsed.tx, parsed.currency);
      return { message: 'rolled back' };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
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
