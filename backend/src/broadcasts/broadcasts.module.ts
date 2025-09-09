import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BroadcastEntity } from '../database/entities/broadcast.entity';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastTemplatesController } from './templates.controller';
import { BroadcastTypesController } from './types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BroadcastEntity])],
  providers: [BroadcastsService],
  controllers: [BroadcastsController, BroadcastTemplatesController, BroadcastTypesController],
})
export class BroadcastsModule {}
