import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ChartPaletteResponse,
  ChartPaletteResponseSchema,
} from '../schemas/settings';
import { SettingsService } from '../services/settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('chart-palette')
  @ApiOperation({ summary: 'Get chart palette colors' })
  @ApiResponse({ status: 200, description: 'Chart palette colors' })
  async getChartPalette(): Promise<ChartPaletteResponse> {
    const palette = await this.settings.getChartPalette();
    return ChartPaletteResponseSchema.parse(palette);
  }
}
