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
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '../shims/typeorm';
import { createReadStream } from 'fs';
import { readFile, readdir, stat } from 'fs/promises';
import { Readable } from 'stream';
import { join } from 'path';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { Request } from 'express';
import { Hand } from '../database/entities/hand.entity';
import {
  HandProofResponse as HandProofResponseSchema,
  HandProofsResponse as HandProofsResponseSchema,
  HandReplayResponse as HandReplayResponseSchema,
} from '../schemas/hands';
import type {
  HandProofResponse,
  HandProofsResponse,
  HandReplayResponse,
} from '../schemas/hands';
import { HandLog } from './hand-log';
import { sanitize } from './state-sanitize';
import { GameStateSchema, type GameState } from '@shared/types';
import { EVENT_SCHEMA_VERSION } from '@shared/events';

interface JwtClaims extends JwtPayload {
  sub: string;
  role?: string;
}

@ApiTags('hands')
@Controller('hands')
export class HandController {
  constructor(
    @InjectRepository(Hand) private readonly hands: Repository<Hand>,
    private readonly config: ConfigService,
  ) {}

  private verifyToken(header?: string): JwtClaims {
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = header.slice(7);
    const secrets = this.config.get<string[]>('auth.jwtSecrets', []);
    let payload: JwtClaims | null = null;
    for (const secret of secrets) {
      try {
        payload = jwt.verify(token, secret) as JwtClaims;
        break;
      } catch {
        continue;
      }
    }
    if (!payload) throw new UnauthorizedException();
    return payload;
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

  private async assertParticipantOrAdmin(
    id: string,
    auth?: string,
  ): Promise<string> {
    const { sub: userId, role } = this.verifyToken(auth);
    const participants = await this.getParticipants(id);
    if (role !== 'admin' && !participants.has(userId)) {
      throw new ForbiddenException();
    }
    return userId;
  }

  /** Parse a JSONL hand log, capturing entries and any commitment/proof metadata. */
  private parseHandLog(raw: string): HandLog {
    const log = new HandLog();
    for (const line of raw.trim().split('\n')) {
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        if (Array.isArray(parsed)) {
          (log as any).entries.push(parsed);
        } else if (parsed.commitment) {
          log.recordCommitment(parsed.commitment);
        } else if (parsed.proof) {
          log.recordProof(parsed.proof);
        }
      } catch {
        continue;
      }
    }
    return log;
  }

  /** Load and parse a hand log from disk or DB. */
  private async loadHandLog(id: string): Promise<HandLog> {
    const file = join(process.cwd(), '../storage/hand-logs', `${id}.jsonl`);
    let raw: string | undefined;
    try {
      raw = await readFile(file, 'utf8');
    } catch {
      const hand = await this.hands.findOne({ where: { id } });
      if (!hand || !hand.log) {
        throw new NotFoundException('log not found');
      }
      raw = hand.log;
    }
    return this.parseHandLog(raw);
  }

  @Get('proofs')
  @ApiOperation({ summary: 'List hand proofs' })
  @ApiResponse({ status: 200, description: 'Proofs list' })
  async listProofs(
    @Req() req: Request,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('ids') ids?: string,
  ): Promise<HandProofsResponse> {
    const { role } = this.verifyToken(req.headers['authorization']);
    if (role !== 'admin') {
      throw new ForbiddenException();
    }

    const dir = join(process.cwd(), '../storage/proofs');
    let files: string[] = [];
    try {
      files = await readdir(dir);
    } catch {
      return [];
    }

    const fromMs = from ? Number(from) : undefined;
    const toMs = to ? Number(to) : undefined;
    const idSet = ids ? new Set(ids.split(',')) : undefined;

    const proofs: HandProofsResponse = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const id = file.slice(0, -5);
      if (idSet && !idSet.has(id)) continue;

      const filepath = join(dir, file);
      try {
        const stats = await stat(filepath);
        const mtime = stats.mtimeMs;
        if (fromMs && mtime < fromMs) continue;
        if (toMs && mtime > toMs) continue;

        const raw = await readFile(filepath, 'utf8');
        const proof = HandProofResponseSchema.parse(JSON.parse(raw));
        proofs.push({ id, proof });
      } catch {
        continue;
      }
    }

    return HandProofsResponseSchema.parse(proofs);
  }

  @Get(':id/proof')
  @ApiOperation({ summary: 'Get proof for hand' })
  @ApiResponse({ status: 200, description: 'Proof data' })
  async getProof(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<HandProofResponse> {
    await this.assertParticipantOrAdmin(id, req.headers['authorization']);

    const file = join(process.cwd(), '../storage/hand-logs', `${id}.jsonl`);
    let raw: string;
    try {
      raw = await readFile(file, 'utf8');
    } catch {
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

    const log = this.parseHandLog(raw);
    const { proof } = log.getCommitmentAndProof();
    if (!proof) {
      throw new NotFoundException('proof not found');
    }

    return HandProofResponseSchema.parse(proof);
  }

  @Get(':id/replay')
  @ApiOperation({ summary: 'Replay hand states' })
  @ApiResponse({ status: 200, description: 'Hand replay frames' })
  async getReplay(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<HandReplayResponse> {
    const userId = await this.assertParticipantOrAdmin(
      id,
      req.headers['authorization'],
    );
    const log = await this.loadHandLog(id);
    const frames: HandReplayResponse = [];
    for (const [index, , , state] of log.getAll()) {
      const sanitized = sanitize(state, userId);
      frames.push({
        street: sanitized.street,
        pot: sanitized.pot,
        sidePots: sanitized.sidePots,
        currentBet: sanitized.currentBet,
        players: sanitized.players.map((p) => ({
          id: p.id,
          stack: p.stack,
          folded: p.folded,
          bet: p.bet,
          allIn: p.allIn,
        })),
        communityCards: sanitized.communityCards,
      });
    }
    return HandReplayResponseSchema.parse(frames);
  }

  @Get(':id/state/:index')
  @ApiOperation({ summary: 'Get game state at index' })
  @ApiResponse({ status: 200, description: 'Game state' })
  async getState(
    @Param('id') id: string,
    @Param('index') indexParam: string,
    @Req() req: Request,
  ): Promise<Omit<GameState, 'serverTime'>> {
    const userId = await this.assertParticipantOrAdmin(
      id,
      req.headers['authorization'],
    );

    const index = Number(indexParam);
    if (!Number.isInteger(index) || index < 0) {
      throw new NotFoundException('state not found');
    }
    const log = await this.loadHandLog(id);
    const state = log.reconstruct(index);
    if (!state) {
      throw new NotFoundException('state not found');
    }

    const sanitized = sanitize(state, userId);
    const { serverTime: _serverTime, ...sanitizedState } = sanitized;

    return GameStateSchema.omit({ serverTime: true }).parse({
      ...sanitizedState,
      tick: index + 1,
      version: EVENT_SCHEMA_VERSION,
    });
  }

  @Get(':id/log')
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'Get raw hand log' })
  @ApiResponse({ status: 200, description: 'Log file' })
  async getLog(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<StreamableFile> {
    await this.assertParticipantOrAdmin(id, req.headers['authorization']);

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
