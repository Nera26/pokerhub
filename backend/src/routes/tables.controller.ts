import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  TableSchema,
  TableListSchema,
  type Table,
  type TableList,
  TableDataSchema,
  type TableData,
  CreateTableSchema,
  type CreateTableRequest,
  UpdateTableSchema,
  type UpdateTableRequest,
} from '../schemas/tables';
import { ChatMessagesSchema, SendChatMessageRequestSchema } from '../schemas/chat';
import { TablesService } from '../game/tables.service';
import { ChatService } from '../game/chat.service';
import { TableListQuerySchema } from '@shared/types';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('tables')
@Controller('tables')
export class TablesController {
  constructor(
    private readonly tables: TablesService,
    private readonly chat: ChatService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tables' })
  @ApiResponse({ status: 200, description: 'Array of tables' })
  async list(@Req() req: Request): Promise<TableList> {
    const { status } = TableListQuerySchema.parse(req.query);
    const res = await this.tables.getTables(status);
    return TableListSchema.parse(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get table by id' })
  @ApiResponse({ status: 200, description: 'Table details' })
  async get(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TableData> {
    const res = await this.tables.getTable(id);
    return TableDataSchema.parse(res);
  }

  @Post()
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create a table' })
  @ApiResponse({ status: 201, description: 'Table created' })
  async create(@Body() body: CreateTableRequest): Promise<Table> {
    const parsed = CreateTableSchema.parse(body);
    const created = await this.tables.createTable(parsed);
    return TableSchema.parse(created);
  }

  @Put(':id')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update table' })
  @ApiResponse({ status: 200, description: 'Table updated' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateTableRequest,
  ): Promise<Table> {
    const parsed = UpdateTableSchema.parse(body);
    const updated = await this.tables.updateTable(id, parsed);
    return TableSchema.parse(updated);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete table' })
  @ApiResponse({ status: 204, description: 'Table deleted' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.tables.deleteTable(id);
  }

  @Get(':id/chat')
  @ApiOperation({ summary: 'Get recent chat messages' })
  @ApiResponse({ status: 200, description: 'Chat messages' })
  async getChat(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const msgs = await this.chat.getRecentMessages(id);
    return ChatMessagesSchema.parse(msgs);
  }

  @Post(':id/chat')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Send chat message' })
  @ApiResponse({ status: 204, description: 'Message sent' })
  async sendChat(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: any,
  ): Promise<void> {
    const parsed = SendChatMessageRequestSchema.parse(body);
    await this.chat.appendMessage(id, parsed.userId, parsed.text);
  }
}
