import { Module } from '@nestjs/common';
import { DashboardController } from '../routes/dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class MetricsModule {}
