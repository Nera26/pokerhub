import { EtlService } from '../../src/analytics/etl.service';
import type { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { Logger } from '@nestjs/common';

describe('processEntry', () => {
  const logger = { error: jest.fn() } as unknown as Logger;
  const analytics = { ingest: jest.fn(), archive: jest.fn() } as any;
  const producer = { send: jest.fn() } as any;
  let etl: EtlService;

  beforeEach(() => {
    etl = new EtlService(
      {} as ConfigService,
      analytics,
      {} as unknown as Redis,
      producer,
    );
    (etl as any).logger = logger;
    jest.spyOn(etl, 'runEtl').mockResolvedValue();
    jest.clearAllMocks();
  });

  it('parses and delegates to runEtl', async () => {
    const data = { amount: 100 };
    await (etl as any).processEntry('wallet.credit', ['event', JSON.stringify(data)]);
    expect(etl.runEtl).toHaveBeenCalledWith('wallet.credit', data);
  });

  it('logs on parse error', async () => {
    await (etl as any).processEntry('wallet.credit', ['event', '{bad']);
    expect(logger.error).toHaveBeenCalled();
    expect(etl.runEtl).not.toHaveBeenCalled();
  });
});
