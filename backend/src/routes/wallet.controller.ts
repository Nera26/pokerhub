import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  Get,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RateLimitGuard } from './rate-limit.guard';
import { AuthGuard } from '../auth/auth.guard';
import { SelfGuard } from '../auth/self.guard';
import { WalletService } from '../wallet/wallet.service';
import { KycService } from '../wallet/kyc.service';
import type { Request } from 'express';
import {
  WithdrawSchema,
  type WithdrawRequest,
  DepositSchema,
  type DepositRequest,
  BankTransferDepositRequestSchema,
  type BankTransferDepositRequest,
  BankTransferDepositResponseSchema,
  WalletStatusSchema,
  type WalletStatusResponse,
  WalletTransactionsResponseSchema,
  PendingTransactionsResponseSchema,
  type WalletTransactionsResponse,
  type PendingTransactionsResponse,
  TxSchema,
  type TxRequest,
} from '../schemas/wallet';
import { ZodError } from 'zod';

@UseGuards(AuthGuard, RateLimitGuard, SelfGuard)
@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly kyc: KycService,
  ) {}

  @Post(':id/reserve')
  @ApiOperation({ summary: 'Reserve funds' })
  @ApiResponse({ status: 200, description: 'Funds reserved' })
  async reserve(
    @Param('id') id: string,
    @Body() body: TxRequest,
    @Req() _req: Request,
  ) {
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
  @ApiOperation({ summary: 'Commit reserved funds' })
  @ApiResponse({ status: 200, description: 'Funds committed' })
  async commit(
    @Param('id') _id: string,
    @Body() body: TxRequest,
    @Req() _req: Request,
  ) {
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
  @ApiOperation({ summary: 'Rollback reserved funds' })
  @ApiResponse({ status: 200, description: 'Funds rolled back' })
  async rollback(
    @Param('id') id: string,
    @Body() body: TxRequest,
    @Req() _req: Request,
  ) {
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
  @ApiOperation({ summary: 'Withdraw funds' })
  @ApiResponse({ status: 200, description: 'Withdrawal accepted' })
  async withdraw(
    @Param('id') id: string,
    @Body() body: WithdrawRequest,
    @Req() req: Request,
  ) {
    try {
      const parsed = WithdrawSchema.parse(body);
      const idempotencyKey =
        typeof (body as any).idempotencyKey === 'string'
          ? (body as any).idempotencyKey
          : undefined;
      await this.wallet.withdraw(
        id,
        parsed.amount,
        parsed.deviceId,
        req.ip,
        parsed.currency,
        idempotencyKey,
      );
      return { message: 'withdrawn' };
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post(':id/deposit')
  @ApiOperation({ summary: 'Deposit funds' })
  @ApiResponse({ status: 200, description: 'Deposit initiated' })
  async deposit(
    @Param('id') id: string,
    @Body() body: DepositRequest,
    @Req() req: Request,
  ) {
    try {
      const parsed = DepositSchema.parse(body);
      const idempotencyKey =
        typeof (body as any).idempotencyKey === 'string'
          ? (body as any).idempotencyKey
          : undefined;
      const challenge = await this.wallet.deposit(
        id,
        parsed.amount,
        parsed.deviceId,
        req.ip,
        parsed.currency,
        idempotencyKey,
      );
      return challenge;
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Post(':id/deposit/bank-transfer')
  @ApiOperation({ summary: 'Initiate bank transfer deposit' })
  @ApiResponse({
    status: 200,
    description: 'Deposit reference',
  })
  async bankTransfer(
    @Param('id') id: string,
    @Body() body: BankTransferDepositRequest,
    @Req() req: Request,
  ) {
    try {
      const parsed = BankTransferDepositRequestSchema.parse(body);
      const res = await this.wallet.initiateBankTransfer(
        id,
        parsed.amount,
        parsed.deviceId,
        parsed.ip ?? req.ip,
        parsed.currency,
      );
      return BankTransferDepositResponseSchema.parse(res);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Delete(':id/deposit/:depositId')
  @ApiOperation({ summary: 'Cancel pending deposit' })
  @ApiResponse({ status: 200, description: 'Deposit cancelled' })
  async cancelDeposit(
    @Param('id') id: string,
    @Param('depositId') depositId: string,
    @Req() _req: Request,
  ) {
    await this.wallet.cancelPendingDeposit(id, depositId);
    return { message: 'cancelled' };
  }

  @Post(':id/kyc')
  @ApiOperation({ summary: 'Verify KYC' })
  @ApiResponse({ status: 200, description: 'KYC verification started' })
  async verify(@Param('id') id: string, @Req() _req: Request) {
    await this.kyc.verify(id);
    return { message: 'verified' };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get wallet status' })
  @ApiResponse({ status: 200, description: 'Wallet status' })
  async status(
    @Param('id') id: string,
    @Req() _req: Request,
  ): Promise<WalletStatusResponse> {
    const res = await this.wallet.status(id);
    return WalletStatusSchema.parse(res);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'List wallet transactions' })
  @ApiResponse({ status: 200, description: 'Transaction list' })
  async transactions(
    @Param('id') id: string,
    @Req() _req: Request,
  ): Promise<WalletTransactionsResponse> {
    const res = await this.wallet.transactions(id);
    return WalletTransactionsResponseSchema.parse(res);
  }

  @Get(':id/pending')
  @ApiOperation({ summary: 'List pending transactions' })
  @ApiResponse({ status: 200, description: 'Pending transactions' })
  async pending(
    @Param('id') id: string,
    @Req() _req: Request,
  ): Promise<PendingTransactionsResponse> {
    const res = await this.wallet.pending(id);
    return PendingTransactionsResponseSchema.parse(res);
  }
}
