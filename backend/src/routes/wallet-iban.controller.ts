import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RateLimitGuard } from './rate-limit.guard';
import {
  IbanResponseSchema,
  IbanHistoryResponseSchema,
  IbanUpdateRequestSchema,
  type IbanResponse,
  type IbanHistoryResponse,
  type IbanUpdateRequest,
} from '@shared/wallet.schema';
import { WalletService } from '../wallet/wallet.service';
import type { Request } from 'express';
import { ZodError } from '@shared/types';

@UseGuards(AuthGuard, RateLimitGuard)
@ApiTags('wallet')
@Controller('wallet/iban')
export class WalletIbanController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get current deposit IBAN' })
  @ApiResponse({ status: 200, description: 'Current IBAN details' })
  async getIban(): Promise<IbanResponse> {
    const res = await this.wallet.getDepositIban();
    return IbanResponseSchema.parse(res);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get IBAN change history' })
  @ApiResponse({ status: 200, description: 'IBAN history' })
  async getHistory(): Promise<IbanHistoryResponse> {
    const res = await this.wallet.getIbanHistory();
    return IbanHistoryResponseSchema.parse(res);
  }

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Update deposit IBAN' })
  @ApiResponse({ status: 200, description: 'IBAN updated' })
  async update(
    @Body() body: IbanUpdateRequest,
    @Req() req: Request & { userId: string },
  ): Promise<IbanResponse> {
    try {
      const parsed = IbanUpdateRequestSchema.parse(body);
      const res = await this.wallet.updateDepositIban(parsed, req.userId);
      return IbanResponseSchema.parse(res);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }
}
