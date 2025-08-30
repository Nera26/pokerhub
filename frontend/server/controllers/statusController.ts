import { Request, Response } from 'express';
import { trace, metrics, SpanStatusCode } from '@opentelemetry/api';

const meter = metrics.getMeter('frontend');
const statusCounter = meter.createCounter('frontend_status_requests_total');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function getStatus(req: Request, res: Response) {
  statusCounter.add(1);
  const tracer = trace.getTracer('frontend');
  await tracer.startActiveSpan('statusController.getStatus', async (span) => {
    try {
      const response = await fetch(`${BACKEND_URL}/status`);
      const data = await response.json();
      span.setStatus({ code: SpanStatusCode.OK });
      res.status(response.status).json(data);
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      res.status(500).json({ error: 'Failed to reach backend' });
    } finally {
      span.end();
    }
  });
}
