import { Module } from '@nestjs/common';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastTemplatesController } from './templates.controller';

@Module({
  providers: [BroadcastsService],
  controllers: [BroadcastsController, BroadcastTemplatesController],
})
export class BroadcastsModule {}
