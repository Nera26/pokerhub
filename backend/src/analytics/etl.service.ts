import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import Redis from 'ioredis';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly topicMap: Record<string, string> = {
    game: 'hand',
    tournament: 'tourney',
  };

  constructor(
    config: ConfigService,
    private readonly analytics: AnalyticsService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    const brokers =
      config.get<string>('analytics.kafkaBrokers')?.split(',') ?? [
        'localhost:9092',
      ];
    this.kafka = new Kafka({ brokers });
    this.producer = this.kafka.producer();
    void this.producer.connect();
  }

  async run() {
    const streams = await this.redis.keys('analytics:*');
    const lastIds = new Map<string, string>();
    for (const stream of streams) {
      lastIds.set(stream, '0-0');
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const ids = streams.map((s) => lastIds.get(s) ?? '0-0');
      const res = await this.redis.xread(
        'BLOCK',
        5000,
        'STREAMS',
        ...streams,
        ...ids,
      );
      if (!res) continue;
      for (const [stream, entries] of res) {
        let last = lastIds.get(stream) ?? '0-0';
        const key = stream.split(':')[1];
        const topic = this.topicMap[key] ?? key;
        for (const [id, fields] of entries) {
          last = id;
          try {
            const data = JSON.parse(fields[1] as string) as Record<string, unknown>;
            await Promise.all([
              this.producer.send({
                topic,
                messages: [
                  { value: JSON.stringify({ event: `${key}.event`, data }) },
                ],
              }),
              this.analytics.ingest(`${key}_event`, data),
            ]);
          } catch (err) {
            this.logger.error(err);
          }
        }
        lastIds.set(stream, last);
      }
    }
  }
}

