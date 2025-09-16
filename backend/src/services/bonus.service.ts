import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusOptionEntity } from '../database/entities/bonus-option.entity';
import {
  BonusDefaultsResponse,
  BonusDefaultsResponseSchema,
  BonusOptionsResponse,
  BonusOptionsResponseSchema,
} from '../schemas/bonus';

const BONUS_DEFAULTS = BonusDefaultsResponseSchema.parse({
  name: '',
  type: 'deposit',
  description: '',
  bonusPercent: undefined,
  maxBonusUsd: undefined,
  expiryDate: '',
  eligibility: 'all',
  status: 'active',
});

@Injectable()
export class BonusService {
  constructor(
    @InjectRepository(BonusOptionEntity)
    private readonly repo: Repository<BonusOptionEntity>,
  ) {}

  async listOptions(): Promise<BonusOptionsResponse> {
    const rows = await this.repo.find({ order: { id: 'ASC' } });
    return BonusOptionsResponseSchema.parse({
      types: rows
        .filter((r) => r.type)
        .map((r) => ({ value: r.type as string, label: r.label })),
      eligibilities: rows
        .filter((r) => r.eligibility)
        .map((r) => ({ value: r.eligibility as string, label: r.label })),
      statuses: rows
        .filter((r) => r.status)
        .map((r) => ({ value: r.status as string, label: r.label })),
    });
  }

  async getDefaults(): Promise<BonusDefaultsResponse> {
    return { ...BONUS_DEFAULTS };
  }
}
