import { Module } from '@nestjs/common';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { DashboardController } from '../routes/dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MetricsWriterService } from './metrics-writer.service';
import { gaugeFactory } from './gauge.factory';
import { MonitoringController } from './monitoring.controller';
import { SessionModule } from '../session/session.module';

@Module({
  controllers: [DashboardController, MonitoringController],
  imports: [SessionModule],
  providers: [
    DashboardService,
    MetricsWriterService,
    {
      provide: MeterProvider,
      useFactory: () => new MeterProvider(),
    },
    {
      provide: 'ONLINE_USERS_GAUGE',
      useFactory: (provider: MeterProvider) =>
        gaugeFactory(
          provider.getMeter('metrics'),
          'dashboard_online_users',
          { description: 'Active users reported to dashboard' },
        ),
      inject: [MeterProvider],
    },
  ],
  exports: [DashboardService, MetricsWriterService, 'ONLINE_USERS_GAUGE'],
})
export class MetricsModule {}
