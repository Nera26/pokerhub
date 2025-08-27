import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HandProofEntity } from './hand-proof.entity';
import { HandsService } from './hands.service';
import { HandsController } from './hands.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HandProofEntity])],
  providers: [HandsService],
  controllers: [HandsController],
  exports: [HandsService],
})
export class HandsModule {}
