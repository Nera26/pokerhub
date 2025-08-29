import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentController } from './tournament.controller';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament, Seat, Table]),
    GameModule,
    FeatureFlagsModule,
  ],
  controllers: [TournamentController],
  providers: [
    TournamentService,
    TournamentScheduler,
    TableBalancerService,
    PkoService,
    RebuyService,
    SatelliteService,
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
