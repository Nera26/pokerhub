import { EtlService } from '../../src/analytics/etl.service';
import { Logger } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { ValidateFunction } from 'ajv';
import type { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';

describe('runEtl', () => {
  const logger = { warn: jest.fn() } as unknown as Logger;
  const producer = {
    send: jest.fn().mockResolvedValue(undefined),
  } as unknown as Producer;
  const analytics = {
    ingest: jest.fn().mockResolvedValue(undefined),
    archive: jest.fn().mockResolvedValue(undefined),
  };

  let etl: EtlService;

  beforeEach(() => {
    etl = new EtlService(
      {} as ConfigService,
      analytics as any,
      {} as unknown as Redis,
      producer,
    );
    (etl as any).logger = logger;
    (etl as any).topicMap = { foo: 'bar' };
    jest.clearAllMocks();
  });

  it('sends to kafka and archives when valid', async () => {
    (etl as any).validators = {
      'foo.event': (() => true) as unknown as ValidateFunction,
    };
    await etl.runEtl('foo.event', { ok: true });
    expect(producer.send).toHaveBeenCalledWith({
      topic: 'bar',
      messages: [{ value: JSON.stringify({ event: 'foo.event', data: { ok: true } }) }],
    });
    expect(analytics.ingest).toHaveBeenCalledWith('foo_event', { ok: true });
    expect(analytics.archive).toHaveBeenCalledWith('foo.event', { ok: true });
  });

  it('logs and skips on validation error', async () => {
    const validate: ValidateFunction = (() => false) as any;
    (validate as any).errors = [{ message: 'bad' }];
    (etl as any).validators = { 'foo.event': validate };
    (etl as any).ajv = { errorsText: () => 'bad' } as any;
    await etl.runEtl('foo.event', { ok: false });
    expect(logger.warn).toHaveBeenCalledWith('Invalid event foo.event: bad');
    expect(producer.send).not.toHaveBeenCalled();
    expect(analytics.ingest).not.toHaveBeenCalled();
    expect(analytics.archive).not.toHaveBeenCalled();
  });

  it('warns when no topic mapping', async () => {
    (etl as any).validators = {};
    (etl as any).topicMap = {};
    await etl.runEtl('missing.event', {});
    expect(logger.warn).toHaveBeenCalledWith('No topic mapping for event missing.event');
    expect(producer.send).not.toHaveBeenCalled();
  });
});
