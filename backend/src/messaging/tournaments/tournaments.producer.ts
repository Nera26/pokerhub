import { Inject, Injectable, Optional } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TournamentsProducer {
  constructor(
    @Optional()
    @Inject('TOURNAMENTS_SERVICE')
    private readonly client?: ClientProxy,
  ) {}

  scheduleTournament(tournamentId: string, startDate: Date) {
    if (!this.client) {
      return;
    }
    return this.client.emit('tournaments.schedule', {
      tournamentId,
      startDate: startDate.toISOString(),
    });
  }
}
