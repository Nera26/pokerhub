import { Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
export default abstract class AdminTransactionsBase {
  protected abstract listPending(): Promise<unknown>;
  protected abstract confirmPending(id: string, req: Request): Promise<void>;
  protected abstract rejectPending(
    id: string,
    body: unknown,
    req: Request,
  ): Promise<void>;

  @Get()
  @ApiOperation({ summary: 'List pending transactions' })
  @ApiResponse({ status: 200, description: 'Pending transactions' })
  async list() {
    return this.listPending();
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm pending transaction' })
  @ApiResponse({ status: 200, description: 'Transaction confirmed' })
  async confirm(@Param('id') id: string, @Req() req: Request) {
    await this.confirmPending(id, req);
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
    await this.rejectPending(id, body, req);
    return { message: 'rejected' };
  }
}
