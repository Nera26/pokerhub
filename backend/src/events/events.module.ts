import { Module } from '@nestjs/common';
import { EventPublisher } from './events.service';

@Module({
  providers: [EventPublisher],
  exports: [EventPublisher],
})
export class EventsModule {}
