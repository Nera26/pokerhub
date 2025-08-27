import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { AnalyticsService } from './analytics.service';
import { EventSchemas } from '@shared/events';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class EventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(EventConsumerService.name);
  private consumer: Consumer | null = null;
  private readonly s3 = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT,
    forcePathStyle: true,
  });

  constructor(private readonly analytics: AnalyticsService) {}

  async onModuleInit() {
    const broker = process.env.KAFKA_BROKER;
    if (!broker) {
      this.logger.warn('KAFKA_BROKER not configured; event consumer disabled');
      return;
    }

    const kafka = new Kafka({
      clientId: 'pokerhub-analytics',
      brokers: [broker],
    });
    this.consumer = kafka.consumer({ groupId: 'analytics' });
    await this.consumer.connect();
    for (const topic of Object.keys(EventSchemas)) {
      await this.consumer.subscribe({ topic, fromBeginning: true });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;
        try {
          const payload = JSON.parse(message.value.toString());
          const schema = (EventSchemas as any)[topic];
          const event = schema.parse(payload);
          await this.analytics.ingest(`${topic.replace('.', '_')}_events`, event);
          const bucket = process.env.ANALYTICS_S3_BUCKET || 'pokerhub-events';
          await this.s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: `${topic}/${Date.now()}.json`,
              Body: JSON.stringify(event),
            }),
          );
        } catch (err) {
          this.logger.error('Failed to process event', err);
        }
      },
    });
  }
}
