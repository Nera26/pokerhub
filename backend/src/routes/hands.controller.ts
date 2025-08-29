import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';
import { HandLog } from '../game/hand-log';
import { HandStateResponse as HandStateResponseSchema } from '../schemas/hands';
import type { HandStateResponse } from '../schemas/hands';

@Controller('hands')
export class HandsController {
  constructor(
    @InjectRepository(Hand) private readonly hands: Repository<Hand>,
  ) {}

  @Get(':id/state/:actionIndex')
  async getState(
    @Param('id') id: string,
    @Param('actionIndex') actionIndex: string,
  ): Promise<HandStateResponse> {
    const file = join(process.cwd(), '../storage/hand-logs', `${id}.jsonl`);
    let raw: string;
    try {
      raw = await readFile(file, 'utf8');
    } catch {
      throw new NotFoundException('log not found');
    }

    // Reconstruct HandLog from JSONL
    const log = new HandLog();
    for (const line of raw.trim().split('\n')) {
      if (!line) continue;
      const parsed = JSON.parse(line);
      if (Array.isArray(parsed)) {
        (log as any).entries.push(parsed);
      } else if (parsed.commitment) {
        log.recordCommitment(parsed.commitment);
      } else if (parsed.proof) {
        log.recordProof(parsed.proof);
      }
    }

    const idx = Number(actionIndex);
    const state = log.reconstruct(idx);
    if (!state) {
      throw new NotFoundException('state not found');
    }
    return HandStateResponseSchema.parse(state);
  }
}
