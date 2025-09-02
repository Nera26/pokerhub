import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { DashboardService } from '../metrics/dashboard.service';
import {
  DashboardMetricsSchema,
  type DashboardMetrics,
} from '../schemas/dashboard';

@UseGuards(AuthGuard, AdminGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('metrics')
  async metrics(): Promise<DashboardMetrics> {
    const data = await this.dashboard.getMetrics();
    return DashboardMetricsSchema.parse(data);
  }
}
