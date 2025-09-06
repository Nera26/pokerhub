import { Controller, Get, Post, Param, Body, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminMessagesResponseSchema, AdminMessage, ReplyMessageRequest, ReplyMessageRequestSchema } from '../schemas/messages';
import { MessageResponse, MessageResponseSchema } from '../schemas/auth';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/messages')
export class AdminMessagesController {
  private readonly messages: AdminMessage[] = [
    {
      id: 1,
      sender: 'Alice',
      userId: 'user1',
      avatar: '/avatar.png',
      subject: 'Hello',
      preview: 'Hello',
      content: 'Hello there',
      time: '2024-01-01T00:00:00Z',
      read: false,
    },
  ];

  @Get()
  @ApiOperation({ summary: 'List user messages' })
  @ApiResponse({ status: 200, description: 'Messages' })
  list() {
    return AdminMessagesResponseSchema.parse({ messages: this.messages });
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to message' })
  @ApiResponse({ status: 200, description: 'Reply sent' })
  reply(@Param('id') id: string, @Body() body: ReplyMessageRequest): MessageResponse {
    const parsed = ReplyMessageRequestSchema.parse(body);
    const msg = this.messages.find((m) => m.id === Number(id));
    if (!msg) {
      throw new NotFoundException('Message not found');
    }
    msg.read = true;
    return MessageResponseSchema.parse({ message: 'sent' });
  }
}
