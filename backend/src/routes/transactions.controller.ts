import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  FilterOptionsSchema,
  TransactionEntriesSchema,
  TransactionTypesResponseSchema,
} from '@shared/types';
import { TransactionTabsResponseSchema } from '@shared/wallet.schema';
import { TransactionsService } from '../wallet/transactions.service';

@ApiTags('transactions')
@Controller()
@UseGuards(AuthGuard, AdminGuard)
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}
  @Get('admin/transactions/tabs')
  @ApiOperation({ summary: 'Get transaction tabs' })
  @ApiResponse({ status: 200, description: 'Transaction tabs' })
  async tabs() {
    const res = await this.txService.getTransactionTabs();
    return TransactionTabsResponseSchema.parse(res);
  }
  @Get('transactions/filters')
  @ApiOperation({ summary: 'Get transaction filter options' })
  @ApiResponse({ status: 200, description: 'Filter options' })
  async filters() {
    const res = await this.txService.getFilterOptions();
    return FilterOptionsSchema.parse(res);
  }

  @Get('transactions/types')
  @ApiOperation({ summary: 'Get transaction types' })
  @ApiResponse({ status: 200, description: 'Transaction types' })
  async types() {
    const res = await this.txService.getTransactionTypes();
    return TransactionTypesResponseSchema.parse(res);
  }

  @Get('users/:id/transactions')
  @ApiOperation({ summary: 'List user transactions' })
  @ApiResponse({ status: 200, description: 'Transactions list' })
  async userTransactions(@Param('id') id: string) {
    const res = await this.txService.getUserTransactions(id);
    return TransactionEntriesSchema.parse(res);
  }
}
