import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import { StatusResponse } from '@shared/types';
import type { Request } from 'express';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async getAll(@Req() req: Request) {
    const userId = (req as any).userId as string;
    const notifications = await this.notifications.findForUser(userId);
    return { notifications };
  }

  @Post('mark-all')
  async markAll(@Req() req: Request): Promise<StatusResponse> {
    const userId = (req as any).userId as string;
    await this.notifications.markAllRead(userId);
    return { status: 'ok' };
  }

  @Post(':id')
  async markOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<StatusResponse> {
    const userId = (req as any).userId as string;
    await this.notifications.markRead(id, userId);
    return { status: 'ok' };
  }
}

