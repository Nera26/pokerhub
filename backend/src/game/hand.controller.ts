import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  Header,
  StreamableFile,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import { createInterface } from 'readline';
import { Readable } from 'stream';
import { join } from 'path';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { Hand } from '../database/entities/hand.entity';
import { HandProofResponse as HandProofResponseSchema } from '../schemas/hands';
import type { HandProofResponse } from '../schemas/hands';

@Controller('hands')
export class HandController {
  constructor(
    @InjectRepository(Hand) private readonly hands: Repository<Hand>,
    private readonly config: ConfigService,
  ) {}

  private verifyToken(header?: string) {
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = header.slice(7);
    const secrets = this.config.get<string[]>('auth.jwtSecrets', []);
    let payload: any = null;
    for (const secret of secrets) {
      try {
        payload = jwt.verify(token, secret);
        break;
      } catch {
        continue;
      }
    }
    if (!payload) throw new UnauthorizedException();
    return { userId: payload.sub as string, isAdmin: payload.role === 'admin' };
  }

  private async getParticipants(id: string): Promise<Set<string>> {
    const file = join(process.cwd(), '../storage/hand-logs', `${id}.jsonl`);
    try {
      const raw = await readFile(file, 'utf8');
      return this.extractParticipants(raw);
    } catch {
      const hand = await this.hands.findOne({ where: { id } });
      if (hand) {
        return this.extractParticipants(hand.log);
      }
    }
    return new Set();
  }

  private extractParticipants(raw: string): Set<string> {
    const participants = new Set<string>();
    for (const line of raw.trim().split('\n')) {
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        if (Array.isArray(parsed)) {
          const state = parsed[2];
          if (state?.players) {
            for (const p of state.players) participants.add(p.id);
            break;
          }
        }
      } catch {
        continue;
      }
    }
    return participants;
  }

  @Get(':id/proof')
  async getProof(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<HandProofResponse> {
    const { userId, isAdmin } = this.verifyToken(req.headers['authorization']);
    const participants = await this.getParticipants(id);
    if (!isAdmin && !participants.has(userId)) {
      throw new ForbiddenException();
    }

    const file = join(process.cwd(), '../storage/hand-logs', `${id}.jsonl`);
    try {
      const stream = createReadStream(file, { encoding: 'utf8' });
      const rl = createInterface({ input: stream, crlfDelay: Infinity });
      for await (const line of rl) {
        if (!line) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.proof) {
            return HandProofResponseSchema.parse(parsed.proof);
          }
        } catch {
          continue;
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

  @Get(':id/log')
  @Header('Content-Type', 'text/plain')
  async getLog(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<StreamableFile> {
    const { userId, isAdmin } = this.verifyToken(req.headers['authorization']);
    const participants = await this.getParticipants(id);
    if (!isAdmin && !participants.has(userId)) {
      throw new ForbiddenException();
    }

    const file = join(process.cwd(), '../storage/hand-logs', `${id}.jsonl`);
    try {
      // Prefer the JSONL file if present
      await readFile(file);
      return new StreamableFile(createReadStream(file));
    } catch {
      // Fallback to DB column if file missing
      const hand = await this.hands.findOne({ where: { id } });
      if (!hand) {
        throw new NotFoundException('log not found');
      }
      return new StreamableFile(Readable.from([hand.log]));
    }
  }
}
