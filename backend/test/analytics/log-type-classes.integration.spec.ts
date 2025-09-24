process.env.DATABASE_URL = '';

import { AnalyticsService } from '../../src/analytics/analytics.service';
import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import type { ConfigService } from '@nestjs/config';
import { AuditLogTypeClass } from '../../src/analytics/audit-log-type-class.entity';
import { AuditLogTypeClassDefault } from '../../src/analytics/audit-log-type-class-default.entity';

describe('AnalyticsService log type class defaults (integration)', () => {
  let dataSource: DataSource;
  let service: AnalyticsService;
  let stakeSpy: jest.SpyInstance;
  let engageSpy: jest.SpyInstance;

  beforeAll(async () => {
    stakeSpy = jest
      .spyOn(AnalyticsService.prototype as any, 'scheduleStakeAggregates')
      .mockImplementation(() => undefined);
    engageSpy = jest
      .spyOn(AnalyticsService.prototype as any, 'scheduleEngagementMetrics')
      .mockImplementation(() => undefined);

    const db = newDb();
    db.public.registerFunction({
      name: 'version',
      returns: 'text',
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: 'text',
      implementation: () => 'test',
    });

    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [AuditLogTypeClass, AuditLogTypeClassDefault],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();

    const config = { get: () => undefined } as unknown as ConfigService;

    service = new AnalyticsService(
      config,
      { xrange: jest.fn() } as any,
      {} as any,
      {} as any,
      dataSource.getRepository(AuditLogTypeClass),
      dataSource.getRepository(AuditLogTypeClassDefault),
    );
    await service.onModuleInit();
  });

  afterAll(async () => {
    await dataSource.destroy();
    stakeSpy.mockRestore();
    engageSpy.mockRestore();
  });

  beforeEach(async () => {
    await dataSource.getRepository(AuditLogTypeClass).clear();
  });

  it('returns seeded defaults and merges overrides', async () => {
    const getTypesSpy = jest
      .spyOn(service, 'getAuditLogTypes')
      .mockResolvedValue(['Login', 'Broadcast', 'wallet.commit', 'Custom']);

    await service.upsertLogTypeClassDefault(
      'wallet.commit',
      'bg-accent-blue/20 text-accent-blue',
    );

    await dataSource.getRepository(AuditLogTypeClass).save({
      type: 'Login',
      className: 'override-login',
    });
    await dataSource.getRepository(AuditLogTypeClass).save({
      type: 'Custom',
      className: 'override-custom',
    });

    const defaults = await service.getDefaultLogTypeClasses();
    expect(defaults).toMatchObject({
      Login: 'bg-accent-green/20 text-accent-green',
      Broadcast: 'bg-accent-yellow/20 text-accent-yellow',
      'wallet.commit': 'bg-accent-blue/20 text-accent-blue',
    });

    const classes = await service.getAuditLogTypeClasses();
    expect(classes).toMatchObject({
      Login: 'override-login',
      Broadcast: 'bg-accent-yellow/20 text-accent-yellow',
      'wallet.commit': 'bg-accent-blue/20 text-accent-blue',
      Custom: 'override-custom',
    });

    getTypesSpy.mockRestore();
  });
});
