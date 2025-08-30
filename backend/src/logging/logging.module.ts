import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticLogProducer } from './providers/elastic.producer';
import { LokiLogProducer } from './providers/loki.producer';
import { OtelProvider } from './providers/otel.provider';

@Module({
  imports: [ConfigModule],
  providers: [ElasticLogProducer, LokiLogProducer, OtelProvider],
  exports: [ElasticLogProducer, LokiLogProducer, OtelProvider],
})
export class LoggingModule {}
