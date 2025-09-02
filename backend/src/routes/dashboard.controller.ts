import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { DashboardService } from '../metrics/dashboard.service';
import {
  DashboardMetricsSchema,
  type DashboardMetrics,
} from '../schemas/dashboard';

@UseGuards(AuthGuard, AdminGuard)
@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Metrics data' })
  async metrics(): Promise<DashboardMetrics> {
    const data = await this.dashboard.getMetrics();
    return DashboardMetricsSchema.parse(data);
  }
}
