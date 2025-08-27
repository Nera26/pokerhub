import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TournamentsProducer {
  constructor(
    @Inject('TOURNAMENTS_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  scheduleTournament(tournamentId: string, startDate: Date) {
    return this.client.emit('tournaments.schedule', {
      tournamentId,
      startDate: startDate.toISOString(),
    });
  }
}
