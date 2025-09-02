import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalDecisionRequestSchema } from '../schemas/withdrawals';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AdminGuard)
@ApiTags('withdrawals')
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawals: WithdrawalsService) {}

  @Post(':user/approve')
  @HttpCode(200)
  @ApiOperation({ summary: 'Approve withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal approved' })
  async approve(
    @Param('user') user: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    const { comment } = WithdrawalDecisionRequestSchema.parse(body);
    await this.withdrawals.approve(user, req.userId, comment);
    return { message: 'approved' };
  }

  @Post(':user/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reject withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal rejected' })
  async reject(
    @Param('user') user: string,
    @Body() body: unknown,
    @Req() req: any,
  ) {
    const { comment } = WithdrawalDecisionRequestSchema.parse(body);
    await this.withdrawals.reject(user, req.userId, comment);
    return { message: 'rejected' };
  }
}

