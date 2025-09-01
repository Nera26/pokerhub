import {
  Module,
  Injectable,
  OnModuleInit,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
  forwardRef,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycService } from './kyc.service';
import { GbgProvider } from './providers/gbg.provider';
import { TruliooProvider } from './providers/trulioo.provider';
import { Account } from '../wallet/account.entity';
import { KycVerification } from '../database/entities/kycVerification.entity';
import { User } from '../database/entities/user.entity';
import { UserRepository } from '../users/user.repository';
import { CountryProvider } from './providers/country-provider';
import { startKycWorker } from './kyc.worker';
import { AuthController } from './auth.controller';
import { SessionModule } from '../session/session.module';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { AuthRateLimitMiddleware } from './rate-limit.middleware';
import { SecurityHeadersMiddleware } from './security.middleware';
import { AnalyticsModule } from '../analytics/analytics.module';
import { GeoIpService } from './geoip.service';

@Injectable()
class KycWorker implements OnModuleInit {
  constructor(private readonly kyc: KycService) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    await startKycWorker(this.kyc);
  }
}

function providerFactory(config: ConfigService): CountryProvider {
  const driver = config.get<string>('KYC_PROVIDER');
  switch (driver) {
    case 'trulioo':
      return new TruliooProvider();
    case 'gbg':
    default:
      return new GbgProvider();
  }
}

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Account, KycVerification, User]),
    SessionModule,
    forwardRef(() => AnalyticsModule),
  ],
  providers: [
    {
      provide: 'COUNTRY_PROVIDER',
      inject: [ConfigService],
      useFactory: providerFactory,
    },
    KycService,
    KycWorker,
    AuthService,
    AuthGuard,
    AdminGuard,
    GeoIpService,
    UserRepository,
  ],
  controllers: [AuthController],
  exports: [KycService, AuthGuard, AdminGuard, GeoIpService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware, AuthRateLimitMiddleware)
      .forRoutes(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
      );
  }
}
