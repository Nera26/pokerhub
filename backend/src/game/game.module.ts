import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameEngine } from './engine';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ClockService } from './clock.service';

@Module({
  imports: [AnalyticsModule],
  providers: [GameGateway, GameEngine, ClockService],
})
export class GameModule {}
