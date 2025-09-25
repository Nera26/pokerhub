import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestSupportController } from './test-support.controller';
import { TestSupportService } from './test-support.service';
import { User } from '../database/entities/user.entity';
import { CollusionAudit } from '../analytics/collusion-audit.entity';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CollusionAudit]),
    AnalyticsModule,
  ],
  controllers: [TestSupportController],
  providers: [TestSupportService],
})
export class TestSupportModule {}
