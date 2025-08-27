import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { EventName, EventSchemas, Events } from '@shared/events';

@Injectable()
export class EventPublisher implements OnModuleDestroy {
  private readonly producer: Producer;

  constructor(config: ConfigService) {
    const brokers = config
      .get<string>('analytics.kafkaBrokers')
      ?.split(',') ?? ['localhost:9092'];
    const kafka = new Kafka({ brokers });
    this.producer = kafka.producer();
    void this.producer.connect();
  }

  async emit<T extends EventName>(name: T, payload: Events[T]) {
    const schema = EventSchemas[name];
    const data = schema.parse(payload);
    await this.producer.send({
      topic: name,
      messages: [{ value: JSON.stringify(data) }],
    });
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }
}
