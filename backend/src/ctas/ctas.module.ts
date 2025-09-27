import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtasController } from '../routes/ctas.controller';
import { CTA } from '../database/entities/cta.entity';
import { CTARepository } from './cta.repository';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [TypeOrmModule.forFeature([CTA]), SessionModule],
  controllers: [CtasController],
  providers: [CTARepository],
})
export class CtasModule {}

