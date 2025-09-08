import type { AnalyticsService } from '../../src/analytics/analytics.service';
import type { Producer } from 'kafkajs';
import type { ValidateFunction } from 'ajv';
import { processEntry } from '../../src/analytics/etl.service';

describe('processEntry', () => {
  const analytics = {
    ingest: jest.fn(),
    archive: jest.fn(),
  } as unknown as AnalyticsService;

  const producer = {
    send: jest.fn(),
  } as unknown as Producer;

  const logger = {
    warn: jest.fn(),
    error: jest.fn(),
  } as any;

  const validate: ValidateFunction = ((data: any) => {
    if ('amount' in data) return true;
    (validate as any).errors = [{ message: 'missing amount' }];
    return false;
  }) as any;

  const validators: Record<string, ValidateFunction> = {
    'wallet.credit': validate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips invalid events', async () => {
    await processEntry(
      'wallet',
      'wallet.credit',
      ['event', JSON.stringify({})],
      analytics,
      validators as any,
      producer,
      logger,
    );
    expect(logger.warn).toHaveBeenCalled();
    expect(producer.send).not.toHaveBeenCalled();
    expect(analytics.ingest).not.toHaveBeenCalled();
    expect(analytics.archive).not.toHaveBeenCalled();
  });

  it('processes valid events', async () => {
    const data = { amount: 100 };
    await processEntry(
      'wallet',
      'wallet.credit',
      ['event', JSON.stringify(data)],
      analytics,
      validators as any,
      producer,
      logger,
    );
    expect(producer.send).toHaveBeenCalledWith({
      topic: 'wallet',
      messages: [{ value: JSON.stringify({ event: 'wallet.credit', data }) }],
    });
    expect(analytics.ingest).toHaveBeenCalledWith('wallet_credit', data);
    expect(analytics.archive).toHaveBeenCalledWith('wallet.credit', data);
  });
});

