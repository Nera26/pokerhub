import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { SpectatorGateway } from './spectator.gateway';
import { RoomManager } from './room.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ClockService } from './clock.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hand } from '../database/entities/hand.entity';
import { HandsController } from '../routes/hands.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AnalyticsModule, EventsModule, TypeOrmModule.forFeature([Hand])],
  providers: [GameGateway, SpectatorGateway, RoomManager, ClockService],
  controllers: [HandsController],
})
export class GameModule {}
