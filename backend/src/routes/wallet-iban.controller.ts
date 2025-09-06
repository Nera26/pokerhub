import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { RateLimitGuard } from './rate-limit.guard';
import {
  IbanResponseSchema,
  IbanHistoryResponseSchema,
  type IbanResponse,
  type IbanHistoryResponse,
} from '@shared/wallet.schema';

@UseGuards(AuthGuard, RateLimitGuard)
@ApiTags('wallet')
@Controller('wallet/iban')
export class WalletIbanController {
  @Get()
  @ApiOperation({ summary: 'Get current deposit IBAN' })
  @ApiResponse({ status: 200, description: 'Current IBAN details' })
  getIban(): IbanResponse {
    const res: IbanResponse = {
      iban: 'DE02 5001 0517 5407 4100 72',
      masked: 'DE02 5001 **** **** 1234',
      holder: 'PokerPro Gaming Ltd.',
      instructions: 'Include reference number, transfer within time limit, etc.',
    };
    return IbanResponseSchema.parse(res);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get IBAN change history' })
  @ApiResponse({ status: 200, description: 'IBAN history' })
  getHistory(): IbanHistoryResponse {
    const res: IbanHistoryResponse = {
      history: [],
    };
    return IbanHistoryResponseSchema.parse(res);
  }
}
