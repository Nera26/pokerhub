import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_FILTER } from '@nestjs/core';
import { randomUUID } from 'node:crypto';

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
  systemConfig,
  siteConfig,
  adminConfig,
} from './config';
import { validationSchema } from './config/env.validation';

import { AppController } from './app.controller';
import { AdminMessagesController } from './routes/admin-messages.controller';
import { AdminBonusController } from './routes/admin-bonus.controller'; // expose /admin/bonus/options
import { AdminBonusesController } from './routes/admin-bonuses.controller';
import { PromotionsController } from './routes/promotions.controller';
import { LanguagesController } from './routes/languages.controller';
import { TranslationsController } from './routes/translations.controller';
import { ConfigController } from './routes/config.controller';
import { PrecacheController } from './routes/precache.controller';
import { NavIconsController } from './routes/nav-icons.controller';
import { AdminNavIconsController } from './routes/admin-nav-icons.controller';
import { AdminBlockedCountriesController } from './routes/admin-blocked-countries.controller';
import { HistoryTabsController } from './routes/history-tabs.controller';
import { SettingsController } from './routes/settings.controller';
import { MetadataController } from './routes/metadata.controller';
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
import { AnalyticsModule } from './analytics/analytics.module';
import { TournamentModule } from './tournament/tournament.module';
import { WalletModule } from './wallet/wallet.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { AuthModule } from './auth/auth.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MetricsModule } from './metrics/metrics.module';
import { TiersModule } from './tiers/tiers.module';
import { CtasModule } from './ctas/ctas.module';
import { HistoryModule } from './history/history.module';
import { AdminMessagesService } from './notifications/admin-messages.service';
import { AdminMessageEntity } from './notifications/admin-message.entity';
import { PromotionsService } from './promotions/promotions.service';
import { PromotionEntity } from './database/entities/promotion.entity';
import { PromotionClaimEntity } from './database/entities/promotion-claim.entity';
import { LanguagesService } from './services/languages.service';
import { TranslationsService } from './services/translations.service';
import { LanguageEntity } from './database/entities/language.entity';
import { TranslationEntity } from './database/entities/translation.entity';
import { BonusService } from './services/bonus.service';
import { ChipDenomsService } from './services/chip-denoms.service';
import { TableThemeService } from './services/table-theme.service';
import { NavIconsService } from './services/nav-icons.service';
import { BlockedCountriesService } from './services/blocked-countries.service';
import { HistoryTabsService } from './services/history-tabs.service';
import { SettingsService } from './services/settings.service';
import { DefaultAvatarService } from './services/default-avatar.service';
import { PerformanceThresholdsService } from './services/performance-thresholds.service';
import { BonusOptionEntity } from './database/entities/bonus-option.entity';
import { BonusEntity } from './database/entities/bonus.entity';
import { BonusDefaultEntity } from './database/entities/bonus-default.entity';
import { ChipDenominationEntity } from './database/entities/chip-denomination.entity';
import { TableThemeEntity } from './database/entities/table-theme.entity';
import { NavIconEntity } from './database/entities/nav-icon.entity';
import { BlockedCountryEntity } from './database/entities/blocked-country.entity';
import { HistoryTabEntity } from './database/entities/history-tab.entity';
import { DefaultAvatarEntity } from './database/entities/default-avatar.entity';
import { NavModule } from './nav/nav.module';
import { ChartPaletteEntity } from './database/entities/chart-palette.entity';
import { PerformanceThresholdEntity } from './database/entities/performance-threshold.entity';
import { Transaction } from './wallet/transaction.entity';
import { TestSupportModule } from './test-support/test-support.module';

let cachedDataSource: DataSource | null = null;
const databaseLogger = new Logger('Database');

const testModules =
  (process.env.ENABLE_TEST_ENDPOINTS ?? '').toLowerCase() === '1'
    ? [TestSupportModule]
    : [];

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
        systemConfig,
        siteConfig,
        adminConfig,
      ],
    }),

    LoggerModule.forRoot(),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: config.get<number>('rateLimit.window', 60),
            limit: config.get<number>('rateLimit.max', 5),
          },
        ],
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
      dataSourceFactory: async (options) => {
        if (cachedDataSource) {
          return cachedDataSource;
        }
        const dataSourceOptions = options as DataSourceOptions;
        const dataSource = new DataSource(dataSourceOptions);
        try {
          await dataSource.initialize();
          cachedDataSource = dataSource;
          return dataSource;
        } catch (error) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : String(error ?? 'unknown postgres error');

          databaseLogger.warn(
            `Postgres connection failed (${message}); using in-memory pg-mem database instead.`,
            error as any,
          );

          const { newDb } = await import('pg-mem');
          const db = newDb({ autoCreateForeignKeyIndices: true });
          db.public.registerFunction({
            name: 'version',
            returns: 'text' as any,
            implementation: () => 'pg-mem',
          });
          db.public.registerFunction({
            name: 'current_database',
            returns: 'text' as any,
            implementation: () => 'pg-mem',
          });
          db.public.registerFunction({
            name: 'uuid_generate_v4',
            returns: 'uuid' as any,
            implementation: () => randomUUID(),
          });
          db.public.registerFunction({
            name: 'gen_random_uuid',
            returns: 'uuid' as any,
            implementation: () => randomUUID(),
          });

          const { url: _url, ...rest } = (dataSourceOptions as DataSourceOptions & {
            url?: string;
          });

          const memDataSource = await db.adapters.createTypeormDataSource({
            ...rest,
            type: 'postgres',
            synchronize: true,
          });
          await memDataSource.initialize();
          cachedDataSource = memDataSource;
          return memDataSource;
        }
      },
    }),

    TypeOrmModule.forFeature([
      AdminMessageEntity,
      PromotionEntity,
      PromotionClaimEntity,
      LanguageEntity,
      TranslationEntity,
      BonusOptionEntity,
      BonusEntity,
      BonusDefaultEntity,
      ChipDenominationEntity,
      TableThemeEntity,
      DefaultAvatarEntity,
      NavIconEntity,
      HistoryTabEntity,
      ChartPaletteEntity,
      BlockedCountryEntity,
      PerformanceThresholdEntity,
      Transaction,
    ]),

    // Messaging / Infra
    MessagingModule,
    RedisModule,
    SessionModule,

    // Feature modules
    LeaderboardModule,
    GameModule,
    StorageModule,
    AnalyticsModule,
    TournamentModule,
    WalletModule,
    WithdrawalsModule,
    AuthModule,
    FeatureFlagsModule,
    UsersModule,
    NotificationsModule,
    MetricsModule,
    TiersModule,
    CtasModule,
    HistoryModule,
    NavModule,
    ...testModules,
  ],
  controllers: [
    AppController,
    AdminMessagesController,
    AdminBonusController,
    AdminBonusesController,
    PromotionsController,
    LanguagesController,
    TranslationsController,
    ConfigController,
    PrecacheController,
    NavIconsController,
    AdminNavIconsController,
    HistoryTabsController,
    SettingsController,
    MetadataController,
    AdminBlockedCountriesController,
  ],
  providers: [
    AppService,
    { provide: 'API_CONTRACT_VERSION', useValue: API_CONTRACT_VERSION },
    { provide: APP_FILTER, useClass: ZodExceptionFilter },
    AdminMessagesService,
    PromotionsService,
    LanguagesService,
    TranslationsService,
    NavIconsService,
    HistoryTabsService,
    SettingsService,
    DefaultAvatarService,
    PerformanceThresholdsService,
    BonusService,
    ChipDenomsService,
    TableThemeService,
    BlockedCountriesService,
  ],
})
export class AppModule {}
