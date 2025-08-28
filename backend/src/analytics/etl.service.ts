import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { AnalyticsService } from './analytics.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { EventSchemas, EventName } from '@shared/events';
import { ParquetSchema, ParquetWriter } from 'parquetjs-lite';
import Ajv, { ValidateFunction } from 'ajv';
import { zodToJsonSchema } from 'zod-to-json-schema';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);
  private readonly kafka: Kafka;
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly ajv = new Ajv();
  private readonly validators: Record<EventName, ValidateFunction> = {};
  private readonly batches = new Map<string, Record<string, unknown>[]>();
  private readonly batchSize = 100;

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
    for (const [name, schema] of Object.entries(EventSchemas)) {
      this.validators[name as EventName] = this.ajv.compile(
        zodToJsonSchema(schema, name),
      );
    }
  }

  async run() {
    const consumer = this.kafka.consumer({ groupId: 'analytics-etl' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'poker.events', fromBeginning: true });

    setInterval(
      () =>
        void this.flushAll().catch((err: unknown) => this.logger.error(err)),
      60_000,
    );

    await consumer.run({
      eachMessage: async ({ message }) => {
        const payload = JSON.parse(message.value!.toString()) as {
          event: string;
          data: Record<string, unknown>;
        };
        const validate = this.validators[payload.event as EventName];
        if (validate && !validate(payload.data)) {
          this.logger.warn(
            `Invalid payload for ${payload.event}: ${this.ajv.errorsText(validate.errors)}`,
          );
          return;
        }
        await this.analytics.ingest(
          payload.event.replace('.', '_'),
          payload.data,
        );
        await this.addToBatch(payload.event, payload.data);
      },
    });
  }

  private async addToBatch(event: string, data: Record<string, unknown>) {
    const arr = this.batches.get(event) ?? [];
    arr.push(data);
    this.batches.set(event, arr);
    if (arr.length >= this.batchSize) {
      await this.flush(event);
    }
  }

  private async flush(event: string) {
    const arr = this.batches.get(event);
    if (!arr || arr.length === 0) return;
    const schema = new ParquetSchema(
      Object.fromEntries(
        Object.entries(arr[0]).map(([k, v]) => [
          k,
          { type: typeof v === 'number' ? 'DOUBLE' : 'UTF8' },
        ]),
      ),
    );
    const writer: any = await ParquetWriter.openBuffer(schema);
    for (const row of arr) {
      await writer.appendRow(row);
    }
    const buffer = await writer.close();
    const key = `${event}/${Date.now()}.parquet`;
    await this.s3.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer }),
    );
    this.batches.set(event, []);
  }

  private async flushAll() {
    for (const event of this.batches.keys()) {
      await this.flush(event);
    }
  }
}

