import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { WalletService } from '../wallet/wallet.service';
import {
  PendingDepositsResponseSchema,
  DepositDecisionRequestSchema,
  type DepositDecisionRequest,
} from '../schemas/wallet';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/deposits')
export class AdminDepositsController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'List pending deposits' })
  @ApiResponse({ status: 200, description: 'Pending deposits' })
  async list() {
    const deposits = await this.wallet.listPendingDeposits();
    return PendingDepositsResponseSchema.parse({ deposits });
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm pending deposit' })
  @ApiResponse({ status: 200, description: 'Deposit confirmed' })
  async confirm(@Param('id') id: string, @Req() req: Request) {
    await this.wallet.confirmPendingDeposit(id, req.userId ?? 'admin');
    return { message: 'confirmed' };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject pending deposit' })
  @ApiResponse({ status: 200, description: 'Deposit rejected' })
  async reject(
    @Param('id') id: string,
    @Body() body: DepositDecisionRequest,
    @Req() req: Request,
  ) {
    const parsed = DepositDecisionRequestSchema.parse(body);
    await this.wallet.rejectPendingDeposit(
      id,
      req.userId ?? 'admin',
      parsed.reason,
    );
    return { message: 'rejected' };
  }
}
