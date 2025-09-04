import { randomUUID } from 'crypto';

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
    const config: any = { get: () => undefined };
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
    const publisher = new EventPublisher(config, producer);

    await publisher.emit('hand.start', payload);

    expect(send).toHaveBeenCalledTimes(2);
    expect(publisher.getFailedEvents()).toHaveLength(0);
  });

  it('opens circuit breaker after repeated failures', async () => {
    const send = jest.fn().mockRejectedValue(new Error('fail'));
    const producer: any = { send, connect: jest.fn(), disconnect: jest.fn() };
    const config: any = { get: () => '' };
    const publisher = new EventPublisher(config, producer);

    for (let i = 0; i < 5; i++) {
      await expect(publisher.emit('hand.start', payload)).rejects.toThrow(
        'Failed to publish event hand.start after 3 attempts: fail',
      );
    }

    await expect(publisher.emit('hand.start', payload)).rejects.toThrow(
      'Event publisher circuit breaker open',
    );
    expect(send).toHaveBeenCalledTimes(5 * 3);
    expect(publisher.getFailedEvents()).toHaveLength(5);
    expect(addMock).toHaveBeenCalledTimes(5);
  });
});
