import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { TournamentScheduler } from './scheduler.service';
import { TableBalancerService } from './table-balancer.service';
import { Tournament } from '../database/entities/tournament.entity';
import { Seat } from '../database/entities/seat.entity';
import { Table } from '../database/entities/table.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Seat, Table])],
  controllers: [TournamentController],
  providers: [TournamentService, TournamentScheduler, TableBalancerService],
  exports: [TournamentService, TableBalancerService],
})
export class TournamentModule {}
