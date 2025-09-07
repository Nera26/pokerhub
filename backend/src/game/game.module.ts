import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { SpectatorGateway } from './spectator.gateway';
import { RoomManager } from './room.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ClockService } from './clock.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hand } from '../database/entities/hand.entity';
import { Table } from '../database/entities/table.entity';
import { ChatMessage } from '../database/entities/chatMessage.entity';
import { GameState } from '../database/entities/game-state.entity';
import { User } from '../database/entities/user.entity';
import { TablesController } from '../routes/tables.controller';
import { GameTypesController } from '../routes/game-types.controller';
import { TablesService } from './tables.service';
import { ChatService } from './chat.service';
import { EventsModule } from '../events/events.module';
import { HandController } from './hand.controller';

@Module({
  imports: [
    AnalyticsModule,
    EventsModule,
    TypeOrmModule.forFeature([Hand, Table, ChatMessage, GameState, User]),
  ],
  providers: [
    GameGateway,
    SpectatorGateway,
    RoomManager,
    ClockService,
    TablesService,
    ChatService,
  ],
  controllers: [TablesController, HandController, GameTypesController],
  exports: [RoomManager],
})
export class GameModule {}
