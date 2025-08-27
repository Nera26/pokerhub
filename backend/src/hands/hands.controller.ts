import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { HandsService } from './hands.service';
import { HandProof, HandProofSchema } from '@shared/types';

@Controller('hands')
export class HandsController {
  constructor(private readonly hands: HandsService) {}

  @Get(':id/proof')
  async getProof(@Param('id') id: string): Promise<HandProof> {
    const proof = await this.hands.getProof(id);
    if (!proof) throw new NotFoundException('Proof not found');
    return HandProofSchema.parse(proof);
  }
}
