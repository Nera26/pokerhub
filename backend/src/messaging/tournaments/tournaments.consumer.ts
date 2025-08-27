import { Controller, Logger, Optional } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from '../../analytics/analytics.service';

@Controller()
export class TournamentsConsumer {
  private readonly logger = new Logger(TournamentsConsumer.name);

  constructor(@Optional() private readonly analytics?: AnalyticsService) {}

  @MessagePattern('tournaments.schedule')
  handleSchedule(
    @Payload()
    payload: {
      tournamentId: string;
      startDate: string;
    },
  ) {
    this.logger.debug(
      `Scheduling tournament ${payload.tournamentId} at ${payload.startDate}`,
    );
    // Scheduling logic goes here
    void this.analytics?.recordTournamentEvent({
      type: 'schedule',
      tournamentId: payload.tournamentId,
      startDate: payload.startDate,
    });
  }
}
