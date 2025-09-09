import { Logger } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { ValidateFunction } from 'ajv';
import { EventName } from '@shared/events';

interface EtlAnalytics {
  ingest: (table: string, data: Record<string, unknown>) => Promise<void>;
  archive: (event: string, data: Record<string, unknown>) => Promise<void>;
}

interface RunEtlDeps {
  analytics: EtlAnalytics;
  validators: Record<EventName, ValidateFunction>;
  producer: Producer;
  topicMap: Record<string, string>;
  logger: Logger;
  errorsText?: (errors: unknown) => string;
}

export async function runEtl(
  event: string,
  data: Record<string, unknown>,
  deps: RunEtlDeps,
): Promise<void> {
  const { analytics, validators, producer, topicMap, logger, errorsText } = deps;
  const validate = validators[event as EventName];
  if (validate && !validate(data)) {
    const msg = errorsText ? errorsText(validate.errors) : JSON.stringify(validate.errors);
    logger.warn(`Invalid event ${event}: ${msg}`);
    return;
  }
  const topic = topicMap[event.split('.')[0]];
  if (!topic) {
    logger.warn(`No topic mapping for event ${event}`);
    return;
  }
  await Promise.all([
    producer.send({
      topic,
      messages: [{ value: JSON.stringify({ event, data }) }],
    }),
    analytics.ingest(event.replace('.', '_'), data),
    analytics.archive(event, data),
  ]);
}
