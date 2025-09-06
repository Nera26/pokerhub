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
  PendingWithdrawalsResponseSchema,
  WithdrawalDecisionRequestSchema,
  type WithdrawalDecisionRequest,
} from '../schemas/withdrawals';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/withdrawals')
export class AdminWithdrawalsController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'List pending withdrawals' })
  @ApiResponse({ status: 200, description: 'Pending withdrawals' })
  async list() {
    const withdrawals = await this.wallet.listPendingWithdrawals();
    return PendingWithdrawalsResponseSchema.parse({ withdrawals });
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm pending withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal confirmed' })
  async confirm(@Param('id') id: string, @Req() req: Request) {
    await this.wallet.confirmPendingWithdrawal(id, req.userId ?? 'admin');
    return { message: 'confirmed' };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject pending withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal rejected' })
  async reject(
    @Param('id') id: string,
    @Body() body: WithdrawalDecisionRequest,
    @Req() req: Request,
  ) {
    const parsed = WithdrawalDecisionRequestSchema.parse(body);
    await this.wallet.rejectPendingWithdrawal(
      id,
      req.userId ?? 'admin',
      parsed.comment,
    );
    return { message: 'rejected' };
  }
}
