import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tier } from '../database/entities/tier.entity';
import { TierRepository } from './tier.repository';
import { TierService } from './tier.service';
import { TiersController } from '../routes/tiers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tier])],
  providers: [TierService, TierRepository],
  controllers: [TiersController],
  exports: [TierService],
})
export class TiersModule {}
