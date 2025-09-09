import { ConfigService } from '@nestjs/config';
import * as kafkaModule from '../../src/common/kafka';

const { createKafkaProducer, createKafkaConsumer } = kafkaModule;

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
    const spy = jest.spyOn(kafkaModule, 'createKafka').mockReturnValue(kafka);
    createKafkaProducer(config);
    expect(spy).toHaveBeenCalledWith(config);
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
    const spy = jest.spyOn(kafkaModule, 'createKafka').mockReturnValue(kafka);
    await createKafkaConsumer(config, 'group');
    expect(spy).toHaveBeenCalledWith(config);
    expect(kafka.consumer).toHaveBeenCalledWith({ groupId: 'group' });
    expect(consumerMock.connect).toHaveBeenCalled();
  });
});

