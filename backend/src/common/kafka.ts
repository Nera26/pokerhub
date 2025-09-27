import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer } from 'kafkajs';

const logger = new Logger('Kafka');
const missingKafkaConfigMessage = 'Missing analytics.kafkaBrokers configuration';
let missingProducerWarningLogged = false;
const missingConsumerWarningsLogged = new Set<string>();

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

function hasKafkaConfiguration(config: ConfigService): boolean {
  const brokersConfig = config.get<string>('analytics.kafkaBrokers');
  return parseKafkaBrokers(brokersConfig).length > 0;
}

export function createKafka(config: ConfigService): Kafka {
  const brokersConfig = config.get<string>('analytics.kafkaBrokers');
  const brokers = parseKafkaBrokers(brokersConfig);
  if (brokers.length === 0) {
    throw new Error(missingKafkaConfigMessage);
  }
  return new Kafka({ brokers });
}

export function createKafkaProducer(
  config: ConfigService,
  factory: (config: ConfigService) => Kafka = createKafka,
): Producer {
  if (!hasKafkaConfiguration(config)) {
    if (!missingProducerWarningLogged) {
      logger.warn('analytics.kafkaBrokers not configured; Kafka producer will be disabled.');
      missingProducerWarningLogged = true;
    }
    return createNoopProducer();
  }
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
  if (!hasKafkaConfiguration(config)) {
    if (!missingConsumerWarningsLogged.has(groupId)) {
      logger.warn(
        `analytics.kafkaBrokers not configured; Kafka consumer for group "${groupId}" will be disabled.`,
      );
      missingConsumerWarningsLogged.add(groupId);
    }
    return createNoopConsumer();
  }
  const kafka = factory(config);
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
}

export const __testUtils = {
  parseKafkaBrokers,
  resetMissingKafkaWarnings: () => {
    missingProducerWarningLogged = false;
    missingConsumerWarningsLogged.clear();
  },
};
