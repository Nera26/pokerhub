import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { TournamentsProducer } from './tournaments/tournaments.producer';
import { TournamentsConsumer } from './tournaments/tournaments.consumer';

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
  ],
  providers: [TournamentsProducer],
  controllers: [TournamentsConsumer],
  exports: [TournamentsProducer],
})
export class MessagingModule {}
