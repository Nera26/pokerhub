import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  AdminMessagesResponseSchema,
  ReplyMessageRequest,
  ReplyMessageRequestSchema,
} from '../schemas/messages';
import { MessageResponse, MessageResponseSchema } from '../schemas/auth';
import { AdminMessagesService } from '../notifications/admin-messages.service';
import { HttpCode } from '@nestjs/common';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/messages')
export class AdminMessagesController {
  constructor(private readonly service: AdminMessagesService) {}

  @Get()
  @ApiOperation({ summary: 'List user messages' })
  @ApiResponse({ status: 200, description: 'Messages' })
  async list() {
    const messages = await this.service.list();
    return AdminMessagesResponseSchema.parse({ messages });
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to message' })
  @ApiResponse({ status: 200, description: 'Reply sent' })
  @HttpCode(200)
  async reply(
    @Param('id') id: string,
    @Body() body: ReplyMessageRequest,
  ): Promise<MessageResponse> {
    ReplyMessageRequestSchema.parse(body);
    const msg = await this.service.find(Number(id));
    if (!msg) {
      throw new NotFoundException('Message not found');
    }
    await this.service.markRead(Number(id));
    return MessageResponseSchema.parse({ message: 'sent' });
  }
}
