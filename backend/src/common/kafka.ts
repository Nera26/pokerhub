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

function parseKafkaBrokers(rawValue?: string | null): string[] {
  return rawValue
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];
}

export function createKafka(config: ConfigService): Kafka {
  const brokersConfig = config.get<string>('analytics.kafkaBrokers');
  const brokers = parseKafkaBrokers(brokersConfig);
  if (brokers.length === 0) {
    throw new Error('Missing analytics.kafkaBrokers configuration');
  }
  return new Kafka({ brokers });
}

export function createKafkaProducer(
  config: ConfigService,
  factory: (config: ConfigService) => Kafka = createKafka,
): Producer {
  const kafka = factory(config);
  const producer = kafka.producer();
  void producer.connect();
  return producer;
}

export async function createKafkaConsumer(
  config: ConfigService,
  groupId: string,
  factory: (config: ConfigService) => Kafka = createKafka,
): Promise<Consumer> {
  const kafka = factory(config);
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
}

export const __testUtils = { parseKafkaBrokers };
