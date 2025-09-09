import { runEtl } from '../etl.utils';
import { Logger } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { ValidateFunction } from 'ajv';
import { EventName } from '@shared/events';

describe('runEtl', () => {
  const logger = { warn: jest.fn() } as unknown as Logger;
  const producer = {
    send: jest.fn().mockResolvedValue(undefined),
  } as unknown as Producer;
  const analytics = {
    ingest: jest.fn().mockResolvedValue(undefined),
    archive: jest.fn().mockResolvedValue(undefined),
  };
  const topicMap = { foo: 'bar' } as Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends to kafka and archives when valid', async () => {
    const validators = {
      'foo.event': (() => true) as unknown as ValidateFunction,
    } as Record<EventName, ValidateFunction>;
    await runEtl('foo.event', { ok: true }, {
      analytics,
      validators,
      producer,
      topicMap,
      logger,
    });
    expect(producer.send).toHaveBeenCalledWith({
      topic: 'bar',
      messages: [{ value: JSON.stringify({ event: 'foo.event', data: { ok: true } }) }],
    });
    expect(analytics.ingest).toHaveBeenCalledWith('foo_event', { ok: true });
    expect(analytics.archive).toHaveBeenCalledWith('foo.event', { ok: true });
  });

  it('logs and skips on validation error', async () => {
    const validators = {
      'foo.event': (() => false) as unknown as ValidateFunction,
    } as Record<EventName, ValidateFunction>;
    await runEtl('foo.event', { ok: false }, {
      analytics,
      validators,
      producer,
      topicMap,
      logger,
      errorsText: () => 'bad',
    });
    expect(logger.warn).toHaveBeenCalledWith('Invalid event foo.event: bad');
    expect(producer.send).not.toHaveBeenCalled();
    expect(analytics.ingest).not.toHaveBeenCalled();
    expect(analytics.archive).not.toHaveBeenCalled();
  });

  it('warns when no topic mapping', async () => {
    const validators = {} as Record<EventName, ValidateFunction>;
    await runEtl('missing.event', {}, {
      analytics,
      validators,
      producer,
      topicMap,
      logger,
    });
    expect(logger.warn).toHaveBeenCalledWith('No topic mapping for event missing.event');
    expect(producer.send).not.toHaveBeenCalled();
  });
});
