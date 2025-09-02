import { Inject, Injectable } from '@nestjs/common';
import { ServiceStatusResponse } from '@shared/types';
import { trace, metrics, SpanStatusCode } from '@opentelemetry/api';

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
    const tracer = trace.getTracer('backend');
    return tracer.startActiveSpan('AppService.getStatus', (span) => {
      statusCounter.add(1);
      try {
        span.setStatus({ code: SpanStatusCode.OK });
        return { status: 'ok', contractVersion: this.version };
      } finally {
        span.end();
      }
    });
  }
}
