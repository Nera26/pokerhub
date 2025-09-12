import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import {
  ChartPaletteResponseSchema,
  type ChartPaletteResponse,
} from '@shared/types';

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
}
