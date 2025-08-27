import { Injectable, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { Event } from '@shared/events';

@Injectable()
export class EventsService {
  private readonly producer: Producer;
  private readonly logger = new Logger(EventsService.name);

  constructor() {
    const broker = process.env.KAFKA_BROKER;
    const kafka = new Kafka({
      clientId: 'pokerhub-backend',
      brokers: broker ? [broker] : ['localhost:9092'],
    });
    this.producer = kafka.producer();
  }

  async publish(event: Event) {
    try {
      await this.producer.connect();
      await this.producer.send({
        topic: event.event,
        messages: [{ value: JSON.stringify(event) }],
      });
    } catch (err) {
      this.logger.error('Failed to publish event', err);
    }
  }
}
