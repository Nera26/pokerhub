import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import type { ZodType } from 'zod';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { WalletService } from '../wallet/wallet.service';

interface AdminPendingControllerOpts<TListResponse, TRejectRequest> {
  path: string;
  list: (wallet: WalletService) => Promise<TListResponse>;
  confirm: (
    wallet: WalletService,
    id: string,
    req: Request,
  ) => Promise<void>;
  reject: (
    wallet: WalletService,
    id: string,
    body: TRejectRequest,
    req: Request,
  ) => Promise<void>;
  response: ZodType<TListResponse>;
  request: ZodType<TRejectRequest>;
}

export default function AdminPendingTransactionsController<
  TListResponse,
  TRejectRequest,
>(opts: AdminPendingControllerOpts<TListResponse, TRejectRequest>) {
  const { path, list, confirm, reject, response, request } = opts;

  @Controller(path)
  @ApiTags('admin')
  @UseGuards(AuthGuard, AdminGuard)
  class GenericPendingController {
    constructor(private readonly wallet: WalletService) {}

    @Get()
    @ApiOperation({ summary: 'List pending transactions' })
    @ApiResponse({ status: 200, description: 'Pending transactions' })
    async list() {
      const result = await list(this.wallet);
      return response.parse(result);
    }

    @Post(':id/confirm')
    @ApiOperation({ summary: 'Confirm pending transaction' })
    @ApiResponse({ status: 200, description: 'Transaction confirmed' })
    async confirm(@Param('id') id: string, @Req() req: Request) {
      await confirm(this.wallet, id, req);
      return { message: 'confirmed' };
    }

    @Post(':id/reject')
    @ApiOperation({ summary: 'Reject pending transaction' })
    @ApiResponse({ status: 200, description: 'Transaction rejected' })
    async reject(
      @Param('id') id: string,
      @Body() body: unknown,
      @Req() req: Request,
    ) {
      const parsed = request.parse(body);
      await reject(this.wallet, id, parsed, req);
      return { message: 'rejected' };
    }
  }

  return GenericPendingController;
}

