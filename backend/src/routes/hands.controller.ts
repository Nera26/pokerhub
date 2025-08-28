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
import { HandLog } from '../game/hand-log';
import { HandStateResponse as HandStateResponseSchema } from '../schemas/hands';
import type { HandLogResponse, HandStateResponse } from '../schemas/hands';

@Controller('hands')
export class HandsController {
  constructor(
    @InjectRepository(Hand) private readonly hands: Repository<Hand>,
  ) {}

  @Get(':id/log')
  @Header('Content-Type', 'text/plain')
  async getLog(@Param('id') id: string): Promise<HandLogResponse> {
    const file = join(process.cwd(), '../storage/hand-logs', `${id}.jsonl`);
    try {
      // Prefer the JSONL file if present
      return await readFile(file, 'utf8');
    } catch {
      // Fallback to DB column if file missing
      const hand = await this.hands.findOne({ where: { id } });
      if (!hand) {
        throw new NotFoundException('log not found');
      }
      return hand.log;
    }
  }

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
      if (line) {
        (log as any).entries.push(JSON.parse(line));
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
