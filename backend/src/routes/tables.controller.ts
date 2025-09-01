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
} from '@nestjs/common';
import { ZodError } from 'zod';
import {
  TableSchema,
  TableListSchema,
  type Table,
  type TableList,
  CreateTableSchema,
  type CreateTableRequest,
  UpdateTableSchema,
  type UpdateTableRequest,
} from '../schemas/tables';
import { TablesService } from '../game/tables.service';

@Controller('tables')
export class TablesController {
  constructor(private readonly tables: TablesService) {}

  @Get()
  async list(): Promise<TableList> {
    const res = await this.tables.getTables();
    return TableListSchema.parse(res);
  }

  @Post()
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
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.tables.deleteTable(id);
  }
}
