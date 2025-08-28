import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';
import { HandLog } from '../game/hand-log';
import type { HandProofResponse, HandStateResponse } from '../schemas/hands';

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

  @Get(':id/state/:actionIndex')
  async getState(
    @Param('id') id: string,
    @Param('actionIndex') actionIndex: string,
  ): Promise<HandStateResponse> {
    const file = join(
      process.cwd(),
      '../storage/hand-logs',
      `${id}.jsonl`,
    );
    let raw: string;
    try {
      raw = await readFile(file, 'utf8');
    } catch {
      throw new NotFoundException('log not found');
    }
    const log = new HandLog();
    for (const line of raw.trim().split('\n')) {
      if (line) {
        (log as any).entries.push(JSON.parse(line));
      }
    }
    const state = log.reconstruct(Number(actionIndex));
    if (!state) {
      throw new NotFoundException('state not found');
    }
    return state;
  }
}
