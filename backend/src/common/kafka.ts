import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer } from 'kafkajs';

function createNoopProducer(): Producer {
  return {
    connect: async () => undefined,
    disconnect: async () => undefined,
    send: async () => [],
    sendBatch: async () => undefined,
    sendOffsets: async () => undefined,
    flush: async () => undefined,
    events: {
      CONNECT: 'producer.connect',
      DISCONNECT: 'producer.disconnect',
      REQUEST: 'producer.network.request',
      REQUEST_TIMEOUT: 'producer.network.request_timeout',
    },
    on: () => undefined,
    transaction: async () => ({
      send: async () => [],
      sendOffsets: async () => undefined,
      commit: async () => undefined,
      abort: async () => undefined,
    }),
    logger: () => ({
      namespace: '',
      level: 0,
      label: '',
      log: () => undefined,
    }),
  } as unknown as Producer;
}

function createNoopConsumer(): Consumer {
  return {
    connect: async () => undefined,
    disconnect: async () => undefined,
    stop: async () => undefined,
    subscribe: async () => undefined,
    run: async () => undefined,
    commitOffsets: async () => undefined,
    seek: () => undefined,
    pause: () => undefined,
    resume: () => undefined,
    on: () => undefined,
    logger: () => ({
      namespace: '',
      level: 0,
      label: '',
      log: () => undefined,
    }),
    describeGroup: async () => ({
      state: 'EMPTY',
      members: [],
      protocol: '',
      protocolType: '',
    }),
  } as unknown as Consumer;
}

export function createKafka(config: ConfigService): Kafka | null {
  const brokersConfig = config.get<string>('analytics.kafkaBrokers');
  const brokers =
    brokersConfig?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (brokers.length === 0) {
    console.warn(
      'analytics.kafkaBrokers is not configured; Kafka messaging disabled.',
    );
    return null;
  }
  return new Kafka({ brokers });
}

export function createKafkaProducer(config: ConfigService): Producer {
  const kafka = createKafka(config);
  if (!kafka) {
    return createNoopProducer();
  }
  const producer = kafka.producer();
  void producer.connect();
  return producer;
}

export async function createKafkaConsumer(
  config: ConfigService,
  groupId: string,
): Promise<Consumer> {
  const kafka = createKafka(config);
  if (!kafka) {
    return createNoopConsumer();
  }
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
}
