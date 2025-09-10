import { trace, Span, SpanStatusCode } from '@opentelemetry/api';

export const tracer = trace.getTracer('backend');

export function withSpan<T>(name: string, fn: (span: Span) => T | Promise<T>): T | Promise<T> {
  return tracer.startActiveSpan(name, (span) => {
    try {
      const result = fn(span);
      if (result && typeof (result as any).then === 'function') {
        return (result as Promise<T>)
          .catch((err) => {
            span.recordException(err as Error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            throw err;
          })
          .finally(() => span.end());
      }
      span.end();
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.end();
      throw err;
    }
  });
}
