import { Inject, Injectable } from '@nestjs/common';
import { ServiceStatusResponse } from '@shared/types';
import { metrics, SpanStatusCode } from '@opentelemetry/api';
import { withSpan } from './common/tracing';

const meter = metrics.getMeter('backend');
const statusCounter = meter.createCounter('status_requests_total');

@Injectable()
export class AppService {
  constructor(
    @Inject('API_CONTRACT_VERSION') private readonly version: string,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getStatus(): ServiceStatusResponse {
    return withSpan('AppService.getStatus', (span) => {
      statusCounter.add(1);
      span.setStatus({ code: SpanStatusCode.OK });
      return { status: 'ok', contractVersion: this.version };
    });
  }
}
