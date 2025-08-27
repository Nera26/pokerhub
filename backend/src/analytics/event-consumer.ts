import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { AnalyticsService } from './analytics.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { EventSchemas } from '@shared/events';
import { ParquetSchema, ParquetWriter } from 'parquetjs-lite';

@Injectable()
export class EventConsumer {
  private readonly logger = new Logger(EventConsumer.name);
  private readonly kafka: Kafka;
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    config: ConfigService,
    private readonly analytics: AnalyticsService,
  ) {
    const brokers = config
      .get<string>('analytics.kafkaBrokers')
      ?.split(',') ?? ['localhost:9092'];
    this.kafka = new Kafka({ brokers });
    this.s3 = new S3Client({
      region: config.get<string>('s3.region'),
      endpoint: config.get<string>('s3.endpoint'),
      credentials: {
        accessKeyId: config.get<string>('s3.accessKeyId')!,
        secretAccessKey: config.get<string>('s3.secretAccessKey')!,
      },
      forcePathStyle: !!config.get<string>('s3.endpoint'),
    });
    this.bucket = config.get<string>('s3.bucket')!;
  }

  async run() {
    const consumer = this.kafka.consumer({ groupId: 'analytics-sink' });
    await consumer.connect();
    const topics = Object.keys(EventSchemas);
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: true });
    }

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const payload = JSON.parse(message.value!.toString());
        await this.analytics.ingest(topic.replace('.', '_'), payload);
        await this.writeParquet(topic, payload);
      },
    });
  }

  private async writeParquet(topic: string, payload: any) {
    const schema = new ParquetSchema(
      Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [
          k,
          { type: typeof v === 'number' ? 'DOUBLE' : 'UTF8' },
        ]),
      ),
    );
    const writer = await ParquetWriter.openBuffer(schema);
    await writer.appendRow(payload);
    const buffer = await writer.close();
    const key = `${topic}/${Date.now()}.parquet`;
    await this.s3.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer }),
    );
  }
}
