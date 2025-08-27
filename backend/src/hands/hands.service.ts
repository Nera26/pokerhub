import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HandProofEntity } from './hand-proof.entity';
import { HandProof } from '@shared/types';

@Injectable()
export class HandsService {
  constructor(
    @InjectRepository(HandProofEntity)
    private readonly repo: Repository<HandProofEntity>,
  ) {}

  async recordCommitment(id: string, commitment: string): Promise<void> {
    await this.repo.save({ id, commitment });
  }

  async recordReveal(
    id: string,
    proof: HandProof,
    log?: unknown,
  ): Promise<void> {
    await this.repo.save({ id, ...proof, log });
  }

  async getProof(id: string): Promise<HandProof | null> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity || !entity.seed || !entity.nonce) return null;
    return {
      seed: entity.seed,
      nonce: entity.nonce,
      commitment: entity.commitment,
    };
  }
}
