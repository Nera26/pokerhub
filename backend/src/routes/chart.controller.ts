import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import {
  ChartPaletteResponseSchema,
  type ChartPaletteResponse,
} from '@shared/types';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('chart')
@Controller('chart')
export class ChartController {
  constructor(private readonly settings: SettingsService) {}

  @Get('palette')
  @ApiOperation({ summary: 'Get chart palette colors' })
  @ApiResponse({ status: 200, description: 'Chart palette colors' })
  async getPalette(): Promise<ChartPaletteResponse> {
    const palette = await this.settings.getChartPalette();
    return ChartPaletteResponseSchema.parse(palette);
  }

  @Put('palette')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update chart palette colors' })
  @ApiResponse({ status: 200, description: 'Updated chart palette colors' })
  async setPalette(
    @Body() body: ChartPaletteResponse,
  ): Promise<ChartPaletteResponse> {
    const palette = ChartPaletteResponseSchema.parse(body);
    return await this.settings.setChartPalette(palette);
  }
}
