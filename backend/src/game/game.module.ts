import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameEngine } from './engine';

@Module({
  providers: [GameGateway, GameEngine],
})
export class GameModule {}
