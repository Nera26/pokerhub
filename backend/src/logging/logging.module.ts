import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticLogProducer } from './providers/elastic.producer';
import { LokiLogProducer } from './providers/loki.producer';

@Module({
  imports: [ConfigModule],
  providers: [ElasticLogProducer, LokiLogProducer],
  exports: [ElasticLogProducer, LokiLogProducer],
})
export class LoggingModule {}
