import { EtlService } from '../../src/analytics/etl.service';
import { EventName } from '@shared/events';
import type { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';

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

class MockRedis {
  streams = new Map<string, [string, string][]>();
  seq = 0;
  async xadd(stream: string, id: string, field: string, value: string) {
    const entries = this.streams.get(stream) ?? [];
    const entryId = `${++this.seq}-0`;
    entries.push([entryId, value]);
    this.streams.set(stream, entries);
    return entryId;
  }
  async keys(pattern: string) {
    if (pattern === 'analytics:*') return Array.from(this.streams.keys());
    return [];
  }
  async xread(...args: any[]) {
    const streamsIndex = args.indexOf('STREAMS');
    const streams = args.slice(streamsIndex + 1, streamsIndex + 1 + (args.length - streamsIndex - 1) / 2);
    const ids = args.slice(streamsIndex + 1 + streams.length);
    const result: any[] = [];
    streams.forEach((s: string, i: number) => {
      const entries = this.streams.get(s) ?? [];
      const lastId = ids[i];
      const newEntries = entries.filter(([id]) => id > lastId);
      if (newEntries.length) {
        result.push([s, newEntries.map(([id, val]) => [id, ['event', val]])]);
      }
    });
    return result.length ? result : null;
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
    'action.bet': {
      handId: '00000000-0000-4000-8000-000000000010',
      playerId: '00000000-0000-4000-8000-000000000011',
      amount: 10,
    },
    'action.call': {
      handId: '00000000-0000-4000-8000-000000000010',
      playerId: '00000000-0000-4000-8000-000000000012',
      amount: 10,
    },
    'action.fold': {
      handId: '00000000-0000-4000-8000-000000000010',
      playerId: '00000000-0000-4000-8000-000000000013',
    },
    'tournament.register': {
      tournamentId: '00000000-0000-4000-8000-000000000020',
      playerId: '00000000-0000-4000-8000-000000000021',
    },
    'tournament.eliminate': {
      tournamentId: '00000000-0000-4000-8000-000000000020',
      playerId: '00000000-0000-4000-8000-000000000021',
      position: 1,
      payout: 1000,
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
      get: () => '',
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

