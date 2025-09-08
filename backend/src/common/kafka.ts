import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

export function createKafkaProducer(config: ConfigService): Producer {
  const brokersConfig = config.get<string>('analytics.kafkaBrokers');
  const brokers =
    brokersConfig?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (brokers.length === 0) {
    throw new Error('Missing analytics.kafkaBrokers configuration');
  }
  const kafka = new Kafka({ brokers });
  const producer = kafka.producer();
  void producer.connect();
  return producer;
}
