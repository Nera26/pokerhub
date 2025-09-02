import { Module } from '@nestjs/common';
import { DashboardController } from '../routes/dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MetricsWriterService } from './metrics-writer.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, MetricsWriterService],
  exports: [DashboardService, MetricsWriterService],
})
export class MetricsModule {}
