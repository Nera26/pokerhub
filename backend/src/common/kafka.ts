import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer } from 'kafkajs';

export function createKafka(config: ConfigService): Kafka {
  const brokersConfig = config.get<string>('analytics.kafkaBrokers');
  const brokers =
    brokersConfig?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (brokers.length === 0) {
    throw new Error('Missing analytics.kafkaBrokers configuration');
  }
  return new Kafka({ brokers });
}

export function createKafkaProducer(config: ConfigService): Producer {
  const kafka = createKafka(config);
  const producer = kafka.producer();
  void producer.connect();
  return producer;
}

export async function createKafkaConsumer(
  config: ConfigService,
  groupId: string,
): Promise<Consumer> {
  const kafka = createKafka(config);
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
}
