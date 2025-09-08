import { ConfigService } from '@nestjs/config';
import { createKafkaProducer } from '../../src/common/kafka';

describe('createKafkaProducer', () => {
  it('throws when brokers are missing', () => {
    const config = new ConfigService({});
    expect(() => createKafkaProducer(config)).toThrow(
      'Missing analytics.kafkaBrokers configuration',
    );
  });
});
