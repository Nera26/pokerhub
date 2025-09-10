import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ChipDenominationsResponse,
  ChipDenominationsResponseSchema,
  TableThemeResponse,
} from '../schemas/config';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ChipDenomsService } from '../services/chip-denoms.service';
import { TableThemeService } from '../services/table-theme.service';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(
    private readonly chips: ChipDenomsService,
    private readonly theme: TableThemeService,
  ) {}

  @Get('chips')
  @ApiOperation({ summary: 'List chip denominations' })
  @ApiResponse({ status: 200, description: 'Chip denominations' })
  listChips(): ChipDenominationsResponse {
    return { denoms: this.chips.get() };
  }

  @Put('chips')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update chip denominations' })
  @ApiResponse({ status: 200, description: 'Updated chip denominations' })
  updateChips(
    @Body() body: ChipDenominationsResponse,
  ): ChipDenominationsResponse {
    const parsed = ChipDenominationsResponseSchema.parse(body);
    return { denoms: this.chips.update(parsed.denoms) };
  }

  @Get('table-theme')
  @ApiOperation({ summary: 'Get table theme' })
  @ApiResponse({ status: 200, description: 'Table theme mapping' })
  getTableTheme(): TableThemeResponse {
    return this.theme.get();
  }
}
