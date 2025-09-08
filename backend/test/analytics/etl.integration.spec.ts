import { EtlService } from '../../src/analytics/etl.service';
import { EventName } from '@shared/events';
import type { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { MockRedis } from '../utils/mock-redis';

class MockProducer {
  send = jest.fn(async () => undefined);
  connect = jest.fn(async () => undefined);
}

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: () => new MockProducer(),
  })),
}));

class MockAnalyticsService {
  tables: Record<string, any[]> = {};
  archives: { event: string; data: any }[] = [];
  async ingest(table: string, data: Record<string, any>) {
    if (!this.tables[table]) this.tables[table] = [];
    this.tables[table].push(data);
  }
  async archive(event: string, data: Record<string, unknown>) {
    this.archives.push({ event, data });
  }
  async query(table: string) {
    return this.tables[table] ?? [];
  }
}


describe('EtlService round-trip', () => {
  const events: Record<EventName, any> = {
    'hand.start': {
      handId: '00000000-0000-4000-8000-000000000000',
      players: ['00000000-0000-4000-8000-000000000001'],
    },
    'hand.end': {
      handId: '00000000-0000-4000-8000-000000000000',
      winners: ['00000000-0000-4000-8000-000000000001'],
    },
    'wallet.credit': {
      accountId: '00000000-0000-4000-8000-000000000002',
      amount: 100,
      refType: 'ref',
      refId: '1',
      currency: 'USD',
    },
    'wallet.debit': {
      accountId: '00000000-0000-4000-8000-000000000002',
      amount: 50,
      refType: 'ref',
      refId: '2',
      currency: 'USD',
    },
    'wallet.reserve': {
      accountId: '00000000-0000-4000-8000-000000000002',
      amount: 75,
      refId: '3',
      currency: 'USD',
    },
    'wallet.commit': {
      refId: '3',
      amount: 75,
      rake: 5,
      currency: 'USD',
    },
    'antiCheat.flag': {
      sessionId: 's1',
      users: ['00000000-0000-4000-8000-000000000030'],
      features: {},
    },
  };

  it('ingests events and makes them queryable', async () => {
    const redis = new MockRedis();
    const analytics = new MockAnalyticsService();
    const config = {
      get: (key: string) =>
        key === 'analytics.kafkaBrokers' ? 'localhost:9092' : undefined,
    } as unknown as ConfigService;
    const service = new EtlService(config, analytics as any, redis as unknown as Redis);

    for (const [event, data] of Object.entries(events) as [EventName, any][]) {
      await redis.xadd(`analytics:${event}`, '*', 'event', JSON.stringify(data));
    }

    await service.drainOnce();
    for (const [event, data] of Object.entries(events) as [EventName, any][]) {
      const table = event.replace('.', '_');
      expect(await analytics.query(table)).toEqual([data]);
      const archived = analytics.archives.find((a) => a.event === event);
      expect(archived?.data).toEqual(data);
    }
  });
});

