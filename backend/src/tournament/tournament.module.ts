import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentController } from './tournament.controller';
import { AdminTournamentsController } from '../routes/admin-tournaments.controller';
import { TournamentService } from './tournament.service';
import { TournamentScheduler } from './scheduler.service';
import { TableBalancerService } from './table-balancer.service';
import { PkoService } from './pko.service';
import { RebuyService } from './rebuy.service';
import { Tournament } from '../database/entities/tournament.entity';
import { Seat } from '../database/entities/seat.entity';
import { Table } from '../database/entities/table.entity';
import { BotProfile } from './bot-profile.entity';
import { BotProfileRepository } from './bot-profile.repository';
import { TournamentFilterOptionEntity } from './tournament-filter-option.entity';
import { TournamentFilterOptionRepository } from './tournament-filter-option.repository';
import { TournamentDetail } from './tournament-detail.entity';
import { TournamentDetailRepository } from './tournament-detail.repository';
import { GameModule } from '../game/game.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { RateLimitGuard } from '../routes/rate-limit.guard';
import { MessagingModule } from '../messaging/messaging.module';
import { TournamentFormatEntity } from './tournament-format.entity';
import { TournamentFormatRepository } from './tournament-format.repository';
import { AdminTournamentFilterEntity } from './admin-tournament-filter.entity';
import { AdminTournamentFilterRepository } from './admin-tournament-filter.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tournament,
      Seat,
      Table,
      BotProfile,
      TournamentFilterOptionEntity,
      TournamentFormatEntity,
      TournamentDetail,
      AdminTournamentFilterEntity,
    ]),
    GameModule,
    FeatureFlagsModule,
    MessagingModule,
  ],
  controllers: [TournamentController, AdminTournamentsController],
  providers: [
    TournamentService,
    TournamentScheduler,
    TableBalancerService,
    PkoService,
    RebuyService,
    RateLimitGuard,
    BotProfileRepository,
    TournamentFilterOptionRepository,
    TournamentFormatRepository,
    TournamentDetailRepository,
    AdminTournamentFilterRepository,
  ],
  exports: [
    TournamentService,
    TableBalancerService,
    PkoService,
    RebuyService,
    BotProfileRepository,
    TournamentFilterOptionRepository,
    TournamentFormatRepository,
    TournamentDetailRepository,
    AdminTournamentFilterRepository,
  ],
})
export class TournamentModule {}
