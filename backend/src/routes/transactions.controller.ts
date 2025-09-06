import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { FilterOptionsSchema, TransactionEntriesSchema } from '@shared/types';

@ApiTags('transactions')
@Controller()
@UseGuards(AuthGuard, AdminGuard)
export class TransactionsController {
  @Get('transactions/filters')
  @ApiOperation({ summary: 'Get transaction filter options' })
  @ApiResponse({ status: 200, description: 'Filter options' })
  filters() {
    return FilterOptionsSchema.parse({
      types: ['Admin Add', 'Admin Remove', 'Withdrawal', 'Deposit', 'Bonus', 'Game Buy-in', 'Winnings'],
      performedBy: ['Admin', 'User', 'System'],
    });
  }

  @Get('users/:id/transactions')
  @ApiOperation({ summary: 'List user transactions' })
  @ApiResponse({ status: 200, description: 'Transactions list' })
  userTransactions(@Param('id') _id: string) {
    return TransactionEntriesSchema.parse([]);
  }
}
