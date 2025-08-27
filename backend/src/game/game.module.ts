import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { RoomManager } from './room-worker';
import { AnalyticsModule } from '../analytics/analytics.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [AnalyticsModule, WalletModule],
  providers: [GameGateway, RoomManager],
})
export class GameModule {}
