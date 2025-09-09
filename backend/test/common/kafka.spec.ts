import { ConfigService } from '@nestjs/config';
import {
  createKafkaProducer,
  createKafkaConsumer,
} from '../../src/common/kafka';

describe('createKafkaProducer', () => {
  it('throws when brokers are missing', () => {
    const config = new ConfigService({});
    expect(() => createKafkaProducer(config)).toThrow(
      'Missing analytics.kafkaBrokers configuration',
    );
  });
});

describe('createKafkaConsumer', () => {
  it('throws when brokers are missing', async () => {
    const config = new ConfigService({});
    await expect(
      createKafkaConsumer(config, 'test-group'),
    ).rejects.toThrow('Missing analytics.kafkaBrokers configuration');
  });
});
