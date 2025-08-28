import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Header,
} from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';
import type { HandProofResponse } from '../schemas/hands';
import type { HandLogResponse } from '../schemas/hands';

@Controller('hands')
export class HandsController {
  constructor(
    @InjectRepository(Hand) private readonly hands: Repository<Hand>,
  ) {}

  @Get(':id/proof')
  async getProof(@Param('id') id: string): Promise<HandProofResponse> {
    const hand = await this.hands.findOne({ where: { id } });
    if (!hand) {
      throw new NotFoundException('hand not found');
    }
    return {
      seed: hand.seed!,
      nonce: hand.nonce!,
      commitment: hand.commitment,
    };
  }

  @Get(':id/log')
  @Header('Content-Type', 'text/plain')
  async getLog(@Param('id') id: string): Promise<HandLogResponse> {
    const file = join(process.cwd(), '../storage/hand-logs', `${id}.jsonl`);
    try {
      return await readFile(file, 'utf8');
    } catch {
      const hand = await this.hands.findOne({ where: { id } });
      if (!hand) {
        throw new NotFoundException('log not found');
      }
      return hand.log;
    }
  }
}
