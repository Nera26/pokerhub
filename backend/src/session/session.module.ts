import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { SessionService } from './session.service';

@Module({
  imports: [RedisModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
