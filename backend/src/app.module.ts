import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import {
  databaseConfig,
  redisConfig,
  s3Config,
  loggingConfig,
  analyticsConfig,
  telemetryConfig,
  rabbitmqConfig,
  authConfig,
} from './config';
import { validationSchema } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { API_CONTRACT_VERSION } from '@shared/constants';

import { MessagingModule } from './messaging/messaging.module';

import { RedisModule } from './redis/redis.module';
import { SessionModule } from './session/session.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { GameModule } from './game/game.module';
import { StorageModule } from './storage/storage.module';
import { LoggingModule } from './logging/logging.module';
import { AnalyticsModule } from './analytics/analytics.module';

import { TournamentModule } from './tournament/tournament.module';

import { WalletModule } from './wallet/wallet.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [
        databaseConfig,
        redisConfig,
        s3Config,
        loggingConfig,
        analyticsConfig,
        telemetryConfig,
        rabbitmqConfig,
        authConfig,
      ],
    }),
    LoggerModule.forRoot(),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
    // Database (Postgres via TypeORM)
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        autoLoadEntities: true,
        synchronize: config.get<boolean>('database.synchronize', false),
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

    TournamentModule,

    WalletModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'API_CONTRACT_VERSION',
      useValue: API_CONTRACT_VERSION,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
