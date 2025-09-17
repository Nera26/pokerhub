import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  MonitoringAcceptedResponseSchema,
  WebVitalMetricSchema,
  type MonitoringAcceptedResponse,
  type WebVitalMetric,
} from '@shared/types';
import { MetricsWriterService } from './metrics-writer.service';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly metricsWriter: MetricsWriterService) {}

  @Post()
  @HttpCode(202)
  @ApiOperation({ summary: 'Record web vital sample' })
  @ApiResponse({ status: 202, description: 'Metric accepted' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async record(
    @Body() body: WebVitalMetric,
  ): Promise<MonitoringAcceptedResponse> {
    const metric = WebVitalMetricSchema.parse(body);
    await this.metricsWriter.recordWebVital(metric);
    return MonitoringAcceptedResponseSchema.parse({ status: 'accepted' });
  }
}
