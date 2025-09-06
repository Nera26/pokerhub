import { Controller, Get, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { BroadcastsService } from './broadcasts.service';
import {
  BroadcastSchema,
  BroadcastsResponseSchema,
  SendBroadcastRequestSchema,
  type SendBroadcastRequest,
} from '../schemas/broadcasts';

@UseGuards(AuthGuard, AdminGuard)
@ApiTags('admin')
@Controller('admin/broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcasts: BroadcastsService) {}

  @Get()
  @ApiOperation({ summary: 'List broadcasts' })
  @ApiResponse({ status: 200, description: 'Broadcast list' })
  list() {
    const broadcasts = this.broadcasts.list();
    return BroadcastsResponseSchema.parse({ broadcasts });
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Send broadcast' })
  @ApiResponse({ status: 201, description: 'Broadcast sent' })
  send(@Body() body: SendBroadcastRequest) {
    const parsed = SendBroadcastRequestSchema.parse(body);
    const broadcast = this.broadcasts.send(parsed);
    return BroadcastSchema.parse(broadcast);
  }
}
