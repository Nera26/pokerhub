import {
  MiddlewareConsumer,
  Module,
  NestModule,
  NestMiddleware,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { Request, Response, NextFunction } from 'express';
import { APP_FILTER } from '@nestjs/core';

import {
  databaseConfig,
  redisConfig,
  gcsConfig,
  loggingConfig,
  analyticsConfig,
  telemetryConfig,
  rabbitmqConfig,
  authConfig,
  rateLimitConfig,
  kycConfig,
  geoConfig,
  gameConfig,
  tournamentConfig,
} from './config';
import { validationSchema } from './config/env.validation';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { API_CONTRACT_VERSION } from '@shared/constants';
import { ZodExceptionFilter } from './common/zod-exception.filter';

// Infra / features
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
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { AuthModule } from './auth/auth.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MetricsModule } from './metrics/metrics.module';

class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );

    const original = res.setHeader.bind(res);
    res.setHeader = (name: string, value: any) => {
      if (name.toLowerCase() === 'set-cookie') {
        const cookies = Array.isArray(value) ? value : [value];
        value = cookies.map((c: string) => {
          const lower = c.toLowerCase();
          let cookie = c;
          if (!lower.includes('samesite')) cookie += '; SameSite=Strict';
          if (!lower.includes('httponly')) cookie += '; HttpOnly';
          if (!lower.includes('secure')) cookie += '; Secure';
          return cookie;
        });
      }
      original(name, value);
    };

    next();
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
  load: [
        databaseConfig,
        redisConfig,
        gcsConfig,
        loggingConfig,
        analyticsConfig,
        telemetryConfig,
        rabbitmqConfig,
        authConfig,
        rateLimitConfig,
        kycConfig,
        geoConfig,
        gameConfig,
        tournamentConfig,
      ],
    }),

    LoggerModule.forRoot(),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('rateLimit.window', 60),
        limit: config.get<number>('rateLimit.max', 5),
      }),
    }),

    // Database (Postgres via TypeORM)
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        autoLoadEntities: true,
        // Set to true only for local/dev; keeps prod safe
        synchronize: config.get<boolean>('database.synchronize', false),
      }),
      inject: [ConfigService],
    }),

    // Messaging / Infra
    MessagingModule,
    RedisModule,
    SessionModule,

    // Feature modules
    LeaderboardModule,
    GameModule,
    StorageModule,
    LoggingModule,
    AnalyticsModule,
    TournamentModule,
    WalletModule,
    WithdrawalsModule,
    AuthModule,
    FeatureFlagsModule,
    UsersModule,
    NotificationsModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'API_CONTRACT_VERSION',
      useValue: API_CONTRACT_VERSION,
    },
    {
      provide: APP_FILTER,
      useClass: ZodExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
  }
}
