import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
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
    const notifications = await this.notifications.findForUser(req.userId);
    return { notifications };
  }

  @Post('mark-all')
  async markAll(@Req() req: Request): Promise<StatusResponse> {
    await this.notifications.markAllRead(req.userId);
    return { status: 'ok' };
  }

  @Post(':id')
  async markOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ): Promise<StatusResponse> {
    await this.notifications.markRead(id, req.userId);
    return { status: 'ok' };
  }
}

