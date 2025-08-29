import { Module, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycService } from './kyc.service';
import { GbgProvider } from './providers/gbg.provider';
import { TruliooProvider } from './providers/trulioo.provider';
import { Account } from '../wallet/account.entity';
import { KycVerification } from '../database/entities/kycVerification.entity';
import { CountryProvider } from './providers/country-provider';
import { startKycWorker } from './kyc.worker';
import { AuthController } from './auth.controller';
import { RateLimitGuard } from '../routes/rate-limit.guard';
import { SessionModule } from '../session/session.module';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';

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
    TypeOrmModule.forFeature([Account, KycVerification]),
    SessionModule,
  ],
  providers: [
    {
      provide: 'COUNTRY_PROVIDER',
      inject: [ConfigService],
      useFactory: providerFactory,
    },
    KycService,
    KycWorker,
    RateLimitGuard,
    AuthService,
    AuthGuard,
    AdminGuard,
  ],
  controllers: [AuthController],
  exports: [KycService, AuthGuard, AdminGuard],
})
export class AuthModule {}
