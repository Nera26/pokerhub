import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  FilterOptionsSchema,
  AdminTransactionEntriesSchema,
  TransactionTypesResponseSchema,
  TransactionLogResponseSchema,
  TransactionLogQuerySchema,
  TransactionStatusesResponseSchema,
  TransactionColumnsResponseSchema,
} from '../schemas/transactions';
import { TransactionTabsResponseSchema } from '@shared/wallet.schema';
import { TransactionsService } from '../wallet/transactions.service';
import type { Request } from 'express';

@ApiTags('transactions')
@Controller()
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}
  @UseGuards(AdminGuard)
  @Get('admin/transactions/tabs')
  @ApiOperation({ summary: 'Get transaction tabs' })
  @ApiResponse({ status: 200, description: 'Transaction tabs' })
  async tabs() {
    const res = await this.txService.getTransactionTabs();
    return TransactionTabsResponseSchema.parse(res);
  }
  @UseGuards(AdminGuard)
  @Get('transactions/filters')
  @ApiOperation({ summary: 'Get transaction filter options' })
  @ApiResponse({ status: 200, description: 'Filter options' })
  async filters(@Req() req: Request) {
    const acceptLanguage = req.headers['accept-language'];
    const preferred = Array.isArray(acceptLanguage)
      ? acceptLanguage[0]
      : acceptLanguage;
    const locale = preferred?.split(',')[0]?.trim() ?? 'en';
    const res = await this.txService.getFilterOptions(locale);
    return FilterOptionsSchema.parse(res);
  }

  @UseGuards(AdminGuard)
  @Get('transactions/types')
  @ApiOperation({ summary: 'Get transaction types' })
  @ApiResponse({ status: 200, description: 'Transaction types' })
  async types() {
    const res = await this.txService.getTransactionTypes();
    return TransactionTypesResponseSchema.parse(res);
  }

  @Get('transactions/statuses')
  @ApiOperation({ summary: 'Get transaction statuses' })
  @ApiResponse({ status: 200, description: 'Transaction statuses' })
  async statuses() {
    const res = await this.txService.getTransactionStatuses();
    return TransactionStatusesResponseSchema.parse(res);
  }

  @Get('transactions/columns')
  @ApiOperation({ summary: 'Get transaction columns' })
  @ApiResponse({ status: 200, description: 'Transaction columns' })
  async columns() {
    const res = await this.txService.getTransactionColumns();
    return TransactionColumnsResponseSchema.parse(res);
  }

  @UseGuards(AdminGuard)
  @Get('admin/transactions')
  @ApiOperation({ summary: 'List transactions' })
  @ApiResponse({ status: 200, description: 'Transactions list' })
  async list(@Req() req: Request) {
    const query = TransactionLogQuerySchema.parse(req.query);
    const res = await this.txService.getTransactionsLog(query);
    return TransactionLogResponseSchema.parse(res);
  }

  @UseGuards(AdminGuard)
  @Get('users/:id/transactions')
  @ApiOperation({ summary: 'List user transactions' })
  @ApiResponse({ status: 200, description: 'Transactions list' })
  async userTransactions(@Param('id') id: string) {
    const res = await this.txService.getUserTransactions(id);
    return AdminTransactionEntriesSchema.parse(res);
  }
}
