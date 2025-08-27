import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameEngine } from './engine';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AnalyticsModule],
  providers: [GameGateway, GameEngine],
})
export class GameModule {}
