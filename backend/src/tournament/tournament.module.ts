import { Module } from '@nestjs/common';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { TournamentScheduler } from './scheduler.service';

@Module({
  controllers: [TournamentController],
  providers: [TournamentService, TournamentScheduler],
  exports: [TournamentService],
})
export class TournamentModule {}
