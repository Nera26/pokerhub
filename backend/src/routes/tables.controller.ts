import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  HttpCode,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ZodError } from 'zod';
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
import { AuthGuard } from '../auth/auth.guard';

@Controller('tables')
export class TablesController {
  constructor(
    private readonly tables: TablesService,
    private readonly chat: ChatService,
  ) {}

  @Get()
  async list(): Promise<TableList> {
    const res = await this.tables.getTables();
    return TableListSchema.parse(res);
  }

  @Get(':id')
  async get(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TableData> {
    const res = await this.tables.getTable(id);
    return TableDataSchema.parse(res);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() body: CreateTableRequest): Promise<Table> {
    try {
      const parsed = CreateTableSchema.parse(body);
      const created = await this.tables.createTable(parsed);
      return TableSchema.parse(created);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateTableRequest,
  ): Promise<Table> {
    try {
      const parsed = UpdateTableSchema.parse(body);
      const updated = await this.tables.updateTable(id, parsed);
      return TableSchema.parse(updated);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.tables.deleteTable(id);
  }

  @Get(':id/chat')
  async getChat(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const msgs = await this.chat.getRecentMessages(id);
    return ChatMessagesSchema.parse(msgs);
  }

  @Post(':id/chat')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async sendChat(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: any,
  ): Promise<void> {
    try {
      const parsed = SendChatMessageRequestSchema.parse(body);
      await this.chat.appendMessage(id, parsed.userId, parsed.text);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }
}
