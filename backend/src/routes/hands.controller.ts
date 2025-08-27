import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';

@Controller('hands')
export class HandsController {
  constructor(
    @InjectRepository(Hand) private readonly hands: Repository<Hand>,
  ) {}

  @Get(':id/proof')
  async getProof(@Param('id') id: string) {
    const hand = await this.hands.findOne({ where: { id } });
    if (!hand) {
      throw new NotFoundException('hand not found');
    }
    return {
      seed: hand.seed,
      nonce: hand.nonce,
      commitment: hand.commitment,
    };
  }
}
