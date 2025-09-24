import { Module } from '@nestjs/common';
import { EventPublisher } from './events.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [EventPublisher],
  exports: [EventPublisher],
})
export class EventsModule {}
