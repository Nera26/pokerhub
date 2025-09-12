import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ChipDenominationsResponseSchema,
  TableThemeResponseSchema,
  type ChipDenominationsResponse,
  type TableThemeResponse,
} from '@shared/types';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ChipDenomsService } from '../services/chip-denoms.service';
import { TableThemeService } from '../services/table-theme.service';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(
    private readonly chips: ChipDenomsService,
    private readonly themes: TableThemeService,
  ) {}

  @Get('chips')
  @ApiOperation({ summary: 'List chip denominations' })
  @ApiResponse({ status: 200, description: 'Chip denominations' })
  async listChips(): Promise<ChipDenominationsResponse> {
    return { denoms: await this.chips.get() };
  }

  @Put('chips')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update chip denominations' })
  @ApiResponse({ status: 200, description: 'Updated chip denominations' })
  async updateChips(
    @Body() body: ChipDenominationsResponse,
  ): Promise<ChipDenominationsResponse> {
    const parsed = ChipDenominationsResponseSchema.parse(body);
    return { denoms: await this.chips.update(parsed.denoms) };
  }

  @Get('table-theme')
  @ApiOperation({ summary: 'Get table theme' })
  @ApiResponse({ status: 200, description: 'Table theme mapping' })
  async getTableTheme(): Promise<TableThemeResponse> {
    return await this.themes.get();
  }

  @Put('table-theme')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update table theme' })
  @ApiResponse({ status: 200, description: 'Updated table theme' })
  async updateTableTheme(
    @Body() body: TableThemeResponse,
  ): Promise<TableThemeResponse> {
    const parsed = TableThemeResponseSchema.parse(body);
    return await this.themes.update(parsed);
  }
}
