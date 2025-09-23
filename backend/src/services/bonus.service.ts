import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusOptionEntity } from '../database/entities/bonus-option.entity';
import {
  BonusDefaultsResponse,
  BonusDefaultsResponseSchema,
  BonusSchema,
  type Bonus,
  BonusOptionsResponse,
  BonusOptionsResponseSchema,
  BonusesResponse,
  BonusesResponseSchema,
  BonusCreateRequest,
  BonusCreateRequestSchema,
  BonusUpdateRequest,
  BonusUpdateRequestSchema,
  BonusDefaultsRequest,
  BonusDefaultsRequestSchema,
} from '../schemas/bonus';
import { BonusEntity } from '../database/entities/bonus.entity';
import { BonusDefaultEntity } from '../database/entities/bonus-default.entity';

const BONUS_DEFAULTS = BonusDefaultsResponseSchema.parse({
  name: '',
  type: 'deposit',
  description: '',
  bonusPercent: undefined,
  maxBonusUsd: undefined,
  expiryDate: undefined,
  eligibility: 'all',
  status: 'active',
});

@Injectable()
export class BonusService {
  constructor(
    @InjectRepository(BonusOptionEntity)
    private readonly repo: Repository<BonusOptionEntity>,
    @InjectRepository(BonusEntity)
    private readonly bonuses: Repository<BonusEntity>,
    @InjectRepository(BonusDefaultEntity)
    private readonly defaults: Repository<BonusDefaultEntity>,
  ) {}

  private mapEntity(entity: BonusEntity): Bonus {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      description: entity.description,
      bonusPercent: entity.bonusPercent ?? undefined,
      maxBonusUsd: entity.maxBonusUsd ?? undefined,
      expiryDate: entity.expiryDate ?? undefined,
      eligibility: entity.eligibility,
      status: entity.status,
      claimsTotal: Number(entity.claimsTotal),
      claimsWeek: Number(entity.claimsWeek),
    };
  }

  private preparePayload(
    payload: BonusCreateRequest | BonusUpdateRequest,
  ): Partial<BonusEntity> {
    const prepared: Partial<BonusEntity> = {};

    if ('name' in payload) prepared.name = payload.name;
    if ('type' in payload) prepared.type = payload.type;
    if ('description' in payload) prepared.description = payload.description;
    if ('bonusPercent' in payload)
      prepared.bonusPercent = payload.bonusPercent ?? null;
    if ('maxBonusUsd' in payload)
      prepared.maxBonusUsd = payload.maxBonusUsd ?? null;
    if ('expiryDate' in payload)
      prepared.expiryDate = payload.expiryDate ? payload.expiryDate : null;
    if ('eligibility' in payload) prepared.eligibility = payload.eligibility;
    if ('status' in payload) prepared.status = payload.status;
    if ('claimsTotal' in payload) prepared.claimsTotal = payload.claimsTotal;
    if ('claimsWeek' in payload) prepared.claimsWeek = payload.claimsWeek;

    return prepared;
  }

  private mapDefaults(entity: BonusDefaultEntity | null): BonusDefaultsResponse {
    if (!entity) {
      return { ...BONUS_DEFAULTS };
    }

    return BonusDefaultsResponseSchema.parse({
      name: entity.name,
      type: entity.type,
      description: entity.description,
      bonusPercent: entity.bonusPercent ?? undefined,
      maxBonusUsd: entity.maxBonusUsd ?? undefined,
      expiryDate: entity.expiryDate ?? undefined,
      eligibility: entity.eligibility,
      status: entity.status,
    });
  }

  private prepareDefaultsPayload(
    payload: BonusDefaultsRequest,
  ): Partial<BonusDefaultEntity> {
    return {
      name: payload.name,
      type: payload.type,
      description: payload.description,
      bonusPercent: payload.bonusPercent ?? null,
      maxBonusUsd: payload.maxBonusUsd ?? null,
      expiryDate: payload.expiryDate ? payload.expiryDate : null,
      eligibility: payload.eligibility,
      status: payload.status,
    };
  }

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
    const defaults = await this.defaults.findOne({
      where: {},
      order: { id: 'ASC' },
    });
    return this.mapDefaults(defaults ?? null);
  }

  async createDefaults(
    payload: BonusDefaultsRequest,
  ): Promise<BonusDefaultsResponse> {
    const parsed = BonusDefaultsRequestSchema.parse(payload);
    const existing = await this.defaults.count();
    if (existing > 0) {
      throw new ConflictException('Bonus defaults already exist');
    }
    const entity = this.defaults.create(this.prepareDefaultsPayload(parsed));
    const saved = await this.defaults.save(entity);
    return this.mapDefaults(saved);
  }

  async updateDefaults(
    payload: BonusDefaultsRequest,
  ): Promise<BonusDefaultsResponse> {
    const parsed = BonusDefaultsRequestSchema.parse(payload);
    const existing = await this.defaults.findOne({
      where: {},
      order: { id: 'ASC' },
    });
    if (!existing) {
      return this.createDefaults(parsed);
    }
    const updated = await this.defaults.save({
      ...existing,
      ...this.prepareDefaultsPayload(parsed),
    });
    return this.mapDefaults(updated);
  }

  async deleteDefaults(): Promise<void> {
    await this.defaults.clear();
  }

  async list(): Promise<BonusesResponse> {
    const rows = await this.bonuses.find({ order: { id: 'DESC' } });
    const mapped = rows.map((row) => this.mapEntity(row));
    return BonusesResponseSchema.parse(mapped);
  }

  async create(payload: BonusCreateRequest): Promise<Bonus> {
    const parsed = BonusCreateRequestSchema.parse(payload);
    const entity = this.bonuses.create({
      ...this.preparePayload(parsed),
      claimsTotal: parsed.claimsTotal ?? 0,
      claimsWeek: parsed.claimsWeek ?? 0,
    });
    const saved = await this.bonuses.save(entity);
    return BonusSchema.parse(this.mapEntity(saved));
  }

  async update(id: number, payload: BonusUpdateRequest): Promise<Bonus> {
    const parsed = BonusUpdateRequestSchema.parse(payload);
    const existing = await this.bonuses.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Bonus ${id} not found`);
    }
    const updated = await this.bonuses.save({
      ...existing,
      ...this.preparePayload(parsed),
    });
    return BonusSchema.parse(this.mapEntity(updated));
  }

  async remove(id: number): Promise<void> {
    await this.bonuses.delete(id);
  }
}
