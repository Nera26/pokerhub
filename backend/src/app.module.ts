import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import helmet from 'helmet';
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
import { AdminMessagesController } from './routes/admin-messages.controller';
import { AdminBonusController } from './routes/admin-bonus.controller'; // expose /admin/bonus/options
import { SidebarController } from './routes/sidebar.controller';
import { SidebarService } from './routes/sidebar.service';
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
import { cookieSecurity } from './common/cookie-security.middleware';
import { BroadcastsModule } from './broadcasts/broadcasts.module';
import { TiersModule } from './tiers/tiers.module';
import { CtasModule } from './ctas/ctas.module';
import { AdminMessagesService } from './notifications/admin-messages.service';
import { AdminMessageEntity } from './notifications/admin-message.entity';

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

    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        autoLoadEntities: true,
        synchronize: config.get<boolean>('database.synchronize', false),
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([AdminMessageEntity]),

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
    BroadcastsModule,
    TiersModule,
    CtasModule,
  ],
  controllers: [
    AppController,
    AdminMessagesController,
    AdminBonusController,
    SidebarController,
  ],
  providers: [
    AppService,
    { provide: 'API_CONTRACT_VERSION', useValue: API_CONTRACT_VERSION },
    { provide: APP_FILTER, useClass: ZodExceptionFilter },
    AdminMessagesService,
    SidebarService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        helmet({
          contentSecurityPolicy: {
            directives: { defaultSrc: ["'self'"] },
          },
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
          },
        }),
        cookieSecurity,
      )
      .forRoutes('*');
  }
}
