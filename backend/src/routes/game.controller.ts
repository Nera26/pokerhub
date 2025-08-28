import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { HandLogResponse } from '../schemas/game';

@Controller('game')
export class GameController {
  @Get('hand/:id/log')
  async getHandLog(@Param('id') id: string): Promise<HandLogResponse> {
    const file = join(process.cwd(), '../storage/hand-logs', `${id}.jsonl`);
    try {
      return await readFile(file, 'utf8');
    } catch {
      throw new NotFoundException('log not found');
    }
  }
}
