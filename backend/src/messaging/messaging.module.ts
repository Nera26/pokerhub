import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsProducer } from './tournaments/tournaments.producer';
import { TournamentsConsumer } from './tournaments/tournaments.consumer';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TournamentScheduler } from '../tournament/scheduler.service';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastTemplatesController } from './templates.controller';
import { BroadcastTypesController } from './types.controller';
import { BroadcastEntity } from '../database/entities/broadcast.entity';
import { BroadcastTemplateEntity } from '../database/entities/broadcast-template.entity';
import { BroadcastTypeEntity } from '../database/entities/broadcast-type.entity';

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
    TypeOrmModule.forFeature([
      BroadcastEntity,
      BroadcastTemplateEntity,
      BroadcastTypeEntity,
    ]),
    AnalyticsModule,
  ],
  providers: [
    TournamentsProducer,
    TournamentScheduler,
    BroadcastsService,
  ],
  controllers: [
    TournamentsConsumer,
    BroadcastsController,
    BroadcastTemplatesController,
    BroadcastTypesController,
  ],
  exports: [TournamentsProducer, BroadcastsService],
})
export class MessagingModule {}
