import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ChipDenominationsResponseSchema,
  TableThemeResponseSchema,
  DefaultAvatarResponseSchema,
  PerformanceThresholdsResponseSchema,
} from '@shared/types';
import type { paths } from '@contracts/api';

type ChipDenominationsResponse =
  paths['/config/chips']['get']['responses']['200']['content']['application/json'];
type TableThemeResponse =
  paths['/config/table-theme']['get']['responses']['200']['content']['application/json'];
type DefaultAvatarResponse =
  paths['/config/default-avatar']['get']['responses']['200']['content']['application/json'];
type PerformanceThresholdsResponse =
  paths['/config/performance-thresholds']['get']['responses']['200']['content']['application/json'];
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ChipDenomsService } from '../services/chip-denoms.service';
import { TableThemeService } from '../services/table-theme.service';
import { DefaultAvatarService } from '../services/default-avatar.service';
import { PerformanceThresholdsService } from '../services/performance-thresholds.service';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(
    private readonly chips: ChipDenomsService,
    private readonly themes: TableThemeService,
    private readonly avatars: DefaultAvatarService,
    private readonly thresholds: PerformanceThresholdsService,
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

  @Get('default-avatar')
  @ApiOperation({ summary: 'Get default avatar' })
  @ApiResponse({ status: 200, description: 'Default avatar URL' })
  async getDefaultAvatar(): Promise<DefaultAvatarResponse> {
    return { defaultAvatar: await this.avatars.get() };
  }

  @Put('default-avatar')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update default avatar' })
  @ApiResponse({ status: 200, description: 'Updated default avatar URL' })
  async updateDefaultAvatar(
    @Body() body: DefaultAvatarResponse,
  ): Promise<DefaultAvatarResponse> {
    const parsed = DefaultAvatarResponseSchema.parse(body);
    return { defaultAvatar: await this.avatars.update(parsed.defaultAvatar) };
  }

  @Get('performance-thresholds')
  @ApiOperation({ summary: 'Get performance thresholds' })
  @ApiResponse({ status: 200, description: 'Performance thresholds' })
  async getPerformanceThresholds(): Promise<PerformanceThresholdsResponse> {
    return PerformanceThresholdsResponseSchema.parse(
      await this.thresholds.get(),
    );
  }
}
