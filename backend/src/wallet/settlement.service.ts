import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { SettlementJournal } from './settlement-journal.entity';
import type { Street } from '../game/state-machine';

@Injectable()
export class SettlementService {
  constructor(
    @InjectRepository(SettlementJournal)
    private readonly repo: Repository<SettlementJournal>,
  ) {}

  private buildKey(handId: string, street: Street, idx: number): string {
    return `${handId}#${street}#${idx}`;
  }

  async reserve(handId: string, street: Street, idx: number): Promise<void> {
    const idempotencyKey = this.buildKey(handId, street, idx);
    await this.repo
      .createQueryBuilder()
      .insert()
      .values({
        id: randomUUID(),
        idempotencyKey,
        status: 'reserved',
      })
      .orIgnore()
      .execute();
  }

  async commit(handId: string, street: Street, idx: number): Promise<void> {
    const idempotencyKey = this.buildKey(handId, street, idx);
    await this.repo.update(
      { idempotencyKey, status: 'reserved' },
      { status: 'committed' },
    );
  }
}
