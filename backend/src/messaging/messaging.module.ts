import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { TournamentsProducer } from './tournaments/tournaments.producer';
import { TournamentsConsumer } from './tournaments/tournaments.consumer';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TournamentScheduler } from '../tournament/scheduler.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'TOURNAMENTS_SERVICE',
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('rabbitmq.url')],
            queue: config.get<string>('rabbitmq.queue'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    AnalyticsModule,
  ],
  providers: [TournamentsProducer, TournamentScheduler],
  controllers: [TournamentsConsumer],
  exports: [TournamentsProducer],
})
export class MessagingModule {}
