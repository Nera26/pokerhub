import { SpanStatusCode } from '@opentelemetry/api';
import * as tracing from '../../src/common/tracing';

describe('withSpan', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('ends span on success', async () => {
    const end = jest.fn();
    jest.spyOn(tracing.tracer, 'startActiveSpan').mockImplementation((name: string, fn: any) => {
      return fn({ end } as any);
    });
    await tracing.withSpan('test', () => Promise.resolve('ok'));
    expect(end).toHaveBeenCalled();
  });

  it('records error and ends span on failure', async () => {
    const end = jest.fn();
    const recordException = jest.fn();
    const setStatus = jest.fn();
    const error = new Error('fail');
    jest.spyOn(tracing.tracer, 'startActiveSpan').mockImplementation((name: string, fn: any) => {
      return fn({ end, recordException, setStatus } as any);
    });
    expect(() => tracing.withSpan('test', () => { throw error; })).toThrow(error);
    expect(recordException).toHaveBeenCalledWith(error);
    expect(setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
    expect(end).toHaveBeenCalled();
  });
});
