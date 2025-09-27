import { ConfigService } from '@nestjs/config';
import * as kafkaModule from '../../src/common/kafka';

const { createKafkaProducer, createKafkaConsumer, __testUtils } = kafkaModule;

const { parseKafkaBrokers } = __testUtils;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('createKafkaProducer', () => {
  it('throws when brokers are missing', () => {
    const config = new ConfigService({});
    expect(() => createKafkaProducer(config)).toThrow(
      'Missing analytics.kafkaBrokers configuration',
    );
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
  it('throws when brokers are missing', async () => {
    const config = new ConfigService({});
    await expect(
      createKafkaConsumer(config, 'test-group'),
    ).rejects.toThrow('Missing analytics.kafkaBrokers configuration');
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

