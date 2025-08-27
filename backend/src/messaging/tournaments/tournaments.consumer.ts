import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class TournamentsConsumer {
  private readonly logger = new Logger(TournamentsConsumer.name);

  @MessagePattern('tournaments.schedule')
  handleSchedule(
    @Payload()
    payload: { tournamentId: string; startDate: string },
  ) {
    this.logger.debug(
      `Scheduling tournament ${payload.tournamentId} at ${payload.startDate}`,
    );
    // Scheduling logic goes here
  }
}
