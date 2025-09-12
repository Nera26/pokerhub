import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HistoryTabsResponseSchema,
  type HistoryTabsResponse,
} from '@shared/types';
import { HistoryTabsService } from '../services/history-tabs.service';

@ApiTags('history')
@Controller('history-tabs')
export class HistoryTabsController {
  constructor(private readonly tabs: HistoryTabsService) {}

  @Get()
  @ApiOperation({ summary: 'List history tabs' })
  @ApiResponse({ status: 200, description: 'Available history tabs' })
  async list(): Promise<HistoryTabsResponse> {
    const res = await this.tabs.list();
    return HistoryTabsResponseSchema.parse({ tabs: res });
  }
}
