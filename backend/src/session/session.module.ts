import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { SessionService } from './session.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
