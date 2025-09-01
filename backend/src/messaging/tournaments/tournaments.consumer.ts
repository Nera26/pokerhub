import { Controller, Logger, Optional } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from '../../analytics/analytics.service';
import { TournamentScheduler } from '../../tournament/scheduler.service';

@Controller()
export class TournamentsConsumer {
  private readonly logger = new Logger(TournamentsConsumer.name);

  constructor(
    private readonly scheduler: TournamentScheduler,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {}

  @MessagePattern('tournaments.schedule')
  async handleSchedule(
    @Payload()
    payload: {
      tournamentId: string;
      startDate: string;
    },
  ): Promise<void> {
    this.logger.debug(
      `Scheduling tournament ${payload.tournamentId} at ${payload.startDate}`,
    );
    const start = new Date(payload.startDate);
    if (!payload.tournamentId || Number.isNaN(start.getTime())) {
      this.logger.error('Invalid scheduling payload', payload as unknown);
      return;
    }
    try {
      await this.scheduler.scheduleStart(payload.tournamentId, start);
      void this.analytics?.recordTournamentEvent({
        type: 'schedule',
        tournamentId: payload.tournamentId,
        startDate: payload.startDate,
      });
    } catch (err) {
      this.logger.error('Failed to schedule tournament', err as Error);
    }
  }
}
