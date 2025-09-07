import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentController } from './tournament.controller';
import { AdminTournamentsController } from '../routes/admin-tournaments.controller';
import { TournamentService } from './tournament.service';
import { TournamentScheduler } from './scheduler.service';
import { TableBalancerService } from './table-balancer.service';
import { PkoService } from './pko.service';
import { RebuyService } from './rebuy.service';
import { SatelliteService } from './satellite.service';
import { Tournament } from '../database/entities/tournament.entity';
import { Seat } from '../database/entities/seat.entity';
import { Table } from '../database/entities/table.entity';
import { GameModule } from '../game/game.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { RateLimitGuard } from '../routes/rate-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament, Seat, Table]),
    GameModule,
    FeatureFlagsModule,
  ],
  controllers: [TournamentController, AdminTournamentsController],
  providers: [
    TournamentService,
    TournamentScheduler,
    TableBalancerService,
    PkoService,
    RebuyService,
    SatelliteService,
    RateLimitGuard,
  ],
  exports: [
    TournamentService,
    TableBalancerService,
    PkoService,
    RebuyService,
    SatelliteService,
  ],
})
export class TournamentModule {}
