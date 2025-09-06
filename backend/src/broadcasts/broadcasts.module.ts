import { Module } from '@nestjs/common';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastsController } from './broadcasts.controller';

@Module({
  providers: [BroadcastsService],
  controllers: [BroadcastsController],
})
export class BroadcastsModule {}
