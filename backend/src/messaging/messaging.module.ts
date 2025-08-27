import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TournamentsProducer } from './tournaments/tournaments.producer';
import { TournamentsConsumer } from './tournaments/tournaments.consumer';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TOURNAMENTS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
          queue: 'tournaments',
        },
      },
    ]),
  ],
  providers: [TournamentsProducer],
  controllers: [TournamentsConsumer],
  exports: [TournamentsProducer],
})
export class MessagingModule {}
