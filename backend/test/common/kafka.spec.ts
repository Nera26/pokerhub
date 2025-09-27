import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as kafkaModule from '../../src/common/kafka';

const { createKafkaProducer, createKafkaConsumer, __testUtils } = kafkaModule;

const { parseKafkaBrokers, resetMissingKafkaWarnings } = __testUtils;

beforeEach(() => {
  resetMissingKafkaWarnings();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('createKafkaProducer', () => {
  it('returns a noop producer when brokers are missing', async () => {
    const config = new ConfigService({});
    const factory = jest.fn();
    const producer = createKafkaProducer(config, factory as any);
    expect(factory).not.toHaveBeenCalled();
    await expect(
      producer.send({ topic: 'test', messages: [] } as any),
    ).resolves.toEqual([]);
  });

  it('only logs the missing broker warning once', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn');
    const config = new ConfigService({});

    createKafkaProducer(config, jest.fn() as any);
    createKafkaProducer(config, jest.fn() as any);

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('delegates to createKafka', () => {
    const config = new ConfigService({ analytics: { kafkaBrokers: 'broker:9092' } });
    const kafka: any = {
      producer: jest.fn().mockReturnValue({ connect: jest.fn() }),
    };
    const factory = jest.fn().mockReturnValue(kafka);
    createKafkaProducer(config, factory);
    expect(factory).toHaveBeenCalledWith(config);
    expect(kafka.producer).toHaveBeenCalled();
  });
});

describe('createKafkaConsumer', () => {
  it('returns a noop consumer when brokers are missing', async () => {
    const config = new ConfigService({});
    const factory = jest.fn();
    const consumer = await createKafkaConsumer(config, 'test-group', factory as any);
    expect(factory).not.toHaveBeenCalled();
    await expect(consumer.connect()).resolves.toBeUndefined();
  });

  it('logs the missing broker warning per group only once', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn');
    const config = new ConfigService({});

    await createKafkaConsumer(config, 'group-a', jest.fn() as any);
    await createKafkaConsumer(config, 'group-a', jest.fn() as any);
    await createKafkaConsumer(config, 'group-b', jest.fn() as any);

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      'analytics.kafkaBrokers not configured; Kafka consumer for group "group-a" will be disabled.',
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      2,
      'analytics.kafkaBrokers not configured; Kafka consumer for group "group-b" will be disabled.',
    );
  });

  it('delegates to createKafka', async () => {
    const config = new ConfigService({ analytics: { kafkaBrokers: 'broker:9092' } });
    const consumerMock = { connect: jest.fn().mockResolvedValue(undefined) };
    const kafka: any = {
      consumer: jest.fn().mockReturnValue(consumerMock),
    };
    const factory = jest.fn().mockReturnValue(kafka);
    await createKafkaConsumer(config, 'group', factory);
    expect(factory).toHaveBeenCalledWith(config);
    expect(kafka.consumer).toHaveBeenCalledWith({ groupId: 'group' });
    expect(consumerMock.connect).toHaveBeenCalled();
  });
});

describe('parseKafkaBrokers', () => {
  it('splits comma separated values and trims whitespace', () => {
    expect(parseKafkaBrokers('broker-a:9092, broker-b:9093 ,'))
      .toEqual(['broker-a:9092', 'broker-b:9093']);
  });

  it('returns empty array when value is undefined or empty', () => {
    expect(parseKafkaBrokers(undefined)).toEqual([]);
    expect(parseKafkaBrokers('  ,  ')).toEqual([]);
  });
});

