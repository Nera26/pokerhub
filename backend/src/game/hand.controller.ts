import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';
import {
  HandProofResponse as HandProofResponseSchema,
} from '../schemas/hands';
import type { HandProofResponse } from '../schemas/hands';

@Controller('hands')
export class HandController {
  constructor(
    @InjectRepository(Hand) private readonly hands: Repository<Hand>,
  ) {}

  @Get(':id/proof')
  async getProof(@Param('id') id: string): Promise<HandProofResponse> {
    const hand = await this.hands.findOne({ where: { id } });
    if (!hand || !hand.seed || !hand.nonce) {
      throw new NotFoundException('proof not found');
    }
    return HandProofResponseSchema.parse({
      commitment: hand.commitment,
      seed: hand.seed,
      nonce: hand.nonce,
    });
  }
}
