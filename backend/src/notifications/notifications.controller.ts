import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  StatusResponse,
  UnreadCountResponse,
  NotificationsResponseSchema,
  NotificationFiltersResponseSchema,
} from '@shared/types';
import type { Request } from 'express';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for user' })
  @ApiResponse({ status: 200, description: 'Notifications list' })
  async getAll(@Req() req: Request) {
    const notifications = await this.notifications.findForUser(req.userId);
    const formatted = notifications.map((n) => ({
      ...n,
      timestamp: n.timestamp.toISOString(),
    }));
    return NotificationsResponseSchema.parse({ notifications: formatted });
  }

  @Get('filters')
  @ApiOperation({ summary: 'List available notification filters' })
  @ApiResponse({ status: 200, description: 'Notification filter options' })
  async getFilters(@Req() req: Request) {
    const filters = await this.notifications.getFilterOptions(req.userId);
    return NotificationFiltersResponseSchema.parse(filters);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread notifications count' })
  async getUnread(@Req() req: Request): Promise<UnreadCountResponse> {
    const count = await this.notifications.countUnread(req.userId);
    return { count };
  }

  @Post('mark-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked' })
  async markAll(@Req() req: Request): Promise<StatusResponse> {
    await this.notifications.markAllRead(req.userId);
    return { status: 'ok' };
  }

  @Post(':id')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked' })
  async markOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ): Promise<StatusResponse> {
    await this.notifications.markRead(id, req.userId);
    return { status: 'ok' };
  }
}

