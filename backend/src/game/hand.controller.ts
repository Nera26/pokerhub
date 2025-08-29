import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';
import { HandProofResponse as HandProofResponseSchema } from '../schemas/hands';
import type { HandProofResponse } from '../schemas/hands';

@Controller('hands')
export class HandController {
  constructor(
    @InjectRepository(Hand) private readonly hands: Repository<Hand>,
  ) {}

  @Get(':id/proof')
  async getProof(@Param('id') id: string): Promise<HandProofResponse> {
    const file = join(process.cwd(), '../storage/hand-logs', `${id}.jsonl`);
    try {
      const raw = await readFile(file, 'utf8');
      for (const line of raw.trim().split('\n')) {
        if (!line) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.proof) {
            return HandProofResponseSchema.parse(parsed.proof);
          }
        } catch {
          // ignore malformed lines
        }
      }
    } catch {
      // ignore missing file, fall back to database
    }

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
