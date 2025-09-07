import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtasController } from '../routes/ctas.controller';
import { CTA } from '../database/entities/cta.entity';
import { CTARepository } from './cta.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CTA])],
  controllers: [CtasController],
  providers: [CTARepository],
})
export class CtasModule {}

