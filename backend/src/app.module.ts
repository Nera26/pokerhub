import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import {
  databaseConfig,
  redisConfig,
  s3Config,
  loggingConfig,
  analyticsConfig,
  telemetryConfig,
} from './config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MessagingModule } from './messaging/messaging.module';

import { RedisModule } from './redis/redis.module';
import { SessionModule } from './session/session.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { GameModule } from './game/game.module';
import { StorageModule } from './storage/storage.module';
import { LoggingModule } from './logging/logging.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        redisConfig,
        s3Config,
        loggingConfig,
        analyticsConfig,
        telemetryConfig,
      ],
    }),
    LoggerModule.forRoot(),
    // Database (Postgres via TypeORM)
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        autoLoadEntities: true,
        synchronize: true, // turn off in production
      }),
      inject: [ConfigService],
    }),

    MessagingModule,

    // Redis (caching / pub-sub)
    RedisModule,

    // Sessions (e.g., Redis-backed)
    SessionModule,

    // Feature modules
    LeaderboardModule,
    GameModule,
    StorageModule,
    LoggingModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
