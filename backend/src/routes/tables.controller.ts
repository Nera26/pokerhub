import { Controller, Get } from '@nestjs/common';
import type { Table } from '@shared/types';
import { TablesService } from '../game/tables.service';

@Controller('tables')
export class TablesController {
  constructor(private readonly tables: TablesService) {}

  @Get()
  list(): Table[] {
    return this.tables.getTables();
  }
}
