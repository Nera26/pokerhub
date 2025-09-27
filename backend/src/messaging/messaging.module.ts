import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import type { RmqOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsProducer } from './tournaments/tournaments.producer';
import { TournamentsConsumer } from './tournaments/tournaments.consumer';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TournamentScheduler } from '../tournament/scheduler.service';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastMetadataController } from './metadata.controller';
import { BroadcastEntity } from '../database/entities/broadcast.entity';
import { BroadcastTemplateEntity } from '../database/entities/broadcast-template.entity';
import { BroadcastTypeEntity } from '../database/entities/broadcast-type.entity';
import { SessionModule } from '../session/session.module';
import { logInfrastructureNotice } from '../common/logging';

const hasAmqpConnectionManager = (() => {
  try {
    require.resolve('amqp-connection-manager');
    return true;
  } catch {
    logInfrastructureNotice(
      'amqp-connection-manager is not installed; RabbitMQ messaging client disabled.',
    );
    return false;
  }
})();

const tournamentsClientModule = hasAmqpConnectionManager
  ? [
      ClientsModule.registerAsync([
        {
          name: 'TOURNAMENTS_SERVICE',
          useFactory: (config: ConfigService): RmqOptions => {
            const urlsConfig = config.get<string | string[]>('rabbitmq.url');
            const queue = config.get<string>('rabbitmq.queue');
            const urls = (
              Array.isArray(urlsConfig) ? urlsConfig : [urlsConfig]
            ).filter((value): value is string => Boolean(value));
            if (!urls.length) {
              throw new Error('Missing rabbitmq.url configuration');
            }
            if (!queue) {
              throw new Error('Missing rabbitmq.queue configuration');
            }

            return {
              transport: Transport.RMQ,
              options: {
                urls,
                queue,
              },
            };
          },
          inject: [ConfigService],
        },
      ]),
    ]
  : [];

@Module({
  imports: [
    ...tournamentsClientModule,
    TypeOrmModule.forFeature([
      BroadcastEntity,
      BroadcastTemplateEntity,
      BroadcastTypeEntity,
    ]),
    AnalyticsModule,
    SessionModule,
  ],
  providers: [
    TournamentsProducer,
    TournamentScheduler,
    BroadcastsService,
  ],
  controllers: [
    TournamentsConsumer,
    BroadcastsController,
    BroadcastMetadataController,
  ],
  exports: [TournamentsProducer, BroadcastsService],
})
export class MessagingModule {}
