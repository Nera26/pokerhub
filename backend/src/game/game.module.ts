import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { SpectatorGateway } from './spectator.gateway';
import { RoomManager } from './room.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ClockService } from './clock.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hand } from '../database/entities/hand.entity';
import { HandsController } from '../routes/hands.controller';
import { GameController } from '../routes/game.controller';
import { TablesController } from '../routes/tables.controller';
import { TablesService } from './tables.service';
import { EventsModule } from '../events/events.module';
import { HandController } from './hand.controller';

@Module({
  imports: [AnalyticsModule, EventsModule, TypeOrmModule.forFeature([Hand])],
  providers: [GameGateway, SpectatorGateway, RoomManager, ClockService, TablesService],
  controllers: [HandsController, GameController, TablesController, HandController],
  exports: [RoomManager],
})
export class GameModule {}
