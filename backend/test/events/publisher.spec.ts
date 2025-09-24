import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

const addMock = jest.fn();
const createCounterMock = jest.fn().mockReturnValue({ add: addMock });
const getMeterMock = jest.fn().mockReturnValue({ createCounter: createCounterMock });

jest.mock('@opentelemetry/api', () => ({
  metrics: { getMeter: getMeterMock },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { EventPublisher } = require('../../src/events/events.service');

describe('EventPublisher', () => {
  const payload = { handId: randomUUID(), players: [randomUUID()] };

  it('throws when kafka brokers config missing', () => {
    const config = new ConfigService({});
    expect(() => new EventPublisher(config)).toThrow(
      'Missing analytics.kafkaBrokers configuration',
    );
  });

  it('retries sending events before succeeding', async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(undefined);
    const producer: any = { send, connect: jest.fn(), disconnect: jest.fn() };
    const config: any = { get: () => '' };
    const redis = {
      rpush: jest.fn().mockResolvedValue(1),
      lrange: jest.fn().mockResolvedValue([]),
      lrem: jest.fn().mockResolvedValue(0),
    };
    const publisher = new EventPublisher(config, producer, redis as any);

    await publisher.emit('hand.start', payload);

    expect(send).toHaveBeenCalledTimes(2);
    await expect(publisher.getFailedEvents()).resolves.toHaveLength(0);
    expect(redis.rpush).not.toHaveBeenCalled();
  });

  it('opens circuit breaker after repeated failures', async () => {
    const send = jest.fn().mockRejectedValue(new Error('fail'));
    const producer: any = { send, connect: jest.fn(), disconnect: jest.fn() };
    const config: any = { get: () => '' };
    const store: string[] = [];
    const redis = {
      rpush: jest.fn(async (_key: string, value: string) => {
        store.push(value);
      }),
      lrange: jest.fn(async () => [...store]),
      lrem: jest.fn(async (_key: string, _count: number, value: string) => {
        const index = store.indexOf(value);
        if (index >= 0) {
          store.splice(index, 1);
          return 1;
        }
        return 0;
      }),
    };
    const publisher = new EventPublisher(config, producer, redis as any);

    for (let i = 0; i < 5; i++) {
      await expect(publisher.emit('hand.start', payload)).rejects.toThrow(
        'Failed to publish event hand.start after 3 attempts: fail',
      );
    }

    await expect(publisher.emit('hand.start', payload)).rejects.toThrow(
      'Event publisher circuit breaker open',
    );
    expect(send).toHaveBeenCalledTimes(5 * 3);
    await expect(publisher.getFailedEvents()).resolves.toHaveLength(5);
    expect(addMock).toHaveBeenCalledTimes(5);
    expect(redis.rpush).toHaveBeenCalledTimes(5);
  });

  it('replays failed events from redis storage', async () => {
    const store: string[] = [];
    const redis = {
      rpush: jest.fn(async (_key: string, value: string) => {
        store.push(value);
      }),
      lrange: jest.fn(async () => [...store]),
      lrem: jest.fn(async (_key: string, _count: number, value: string) => {
        const index = store.indexOf(value);
        if (index >= 0) {
          store.splice(index, 1);
          return 1;
        }
        return 0;
      }),
    };
    const send = jest.fn().mockRejectedValue(new Error('fail'));
    const producer: any = { send, connect: jest.fn(), disconnect: jest.fn() };
    const config: any = { get: () => '' };
    const publisher = new EventPublisher(config, producer, redis as any);

    await expect(publisher.emit('hand.start', payload)).rejects.toThrow(
      'Failed to publish event hand.start after 3 attempts: fail',
    );
    await expect(publisher.getFailedEvents()).resolves.toHaveLength(1);

    send.mockImplementation(() => Promise.resolve(undefined));
    await publisher.replayFailed();

    expect(send).toHaveBeenCalledTimes(4); // 3 failed attempts + 1 replay
    await expect(publisher.getFailedEvents()).resolves.toHaveLength(0);
    expect(redis.lrem).toHaveBeenCalled();
  });
});
