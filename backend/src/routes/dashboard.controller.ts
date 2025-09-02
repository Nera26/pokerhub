import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../metrics/dashboard.service';
import {
  DashboardMetricsSchema,
  type DashboardMetrics,
} from '../schemas/dashboard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('metrics')
  async metrics(): Promise<DashboardMetrics> {
    const data = await this.dashboard.getMetrics();
    return DashboardMetricsSchema.parse(data);
  }
}
