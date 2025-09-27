import type { BonusCreateRequest, BonusUpdateRequest } from '../schemas/bonus';
import {
  type Bonus,
  type BonusDefaultsRequest,
  type BonusDefaultsResponse,
  BonusDefaultsResponseSchema,
} from '../schemas/bonus';
import { BonusEntity } from '../database/entities/bonus.entity';
import { BonusDefaultEntity } from '../database/entities/bonus-default.entity';

type BonusBaseSource = Pick<
  BonusDefaultEntity,
  | 'name'
  | 'type'
  | 'description'
  | 'bonusPercent'
  | 'maxBonusUsd'
  | 'expiryDate'
  | 'eligibility'
  | 'status'
>;

type BonusBaseFields = Pick<
  BonusDefaultsResponse,
  | 'name'
  | 'type'
  | 'description'
  | 'bonusPercent'
  | 'maxBonusUsd'
  | 'expiryDate'
  | 'eligibility'
  | 'status'
>;

function nullableNumber(value: unknown): number | undefined {
  if (typeof value !== 'number') {
    return undefined;
  }

  return Number.isFinite(value) ? value : undefined;
}

function mapBonusBaseFields(source: BonusBaseSource): BonusBaseFields {
  return {
    name: source.name,
    type: source.type,
    description: source.description,
    bonusPercent: source.bonusPercent ?? undefined,
    maxBonusUsd: source.maxBonusUsd ?? undefined,
    expiryDate: source.expiryDate ?? undefined,
    eligibility: source.eligibility,
    status: source.status,
  };
}

export function mapBonusEntity(entity: BonusEntity): Bonus {
  return {
    id: entity.id,
    ...mapBonusBaseFields(entity),
    claimsTotal: Number(entity.claimsTotal),
    claimsWeek: Number(entity.claimsWeek),
  };
}

export function toBonusEntityInput(
  payload: BonusCreateRequest | BonusUpdateRequest,
): Partial<BonusEntity> {
  const prepared: Partial<BonusEntity> = {};

  if ('name' in payload) prepared.name = payload.name;
  if ('type' in payload) prepared.type = payload.type;
  if ('description' in payload) prepared.description = payload.description;
  if ('bonusPercent' in payload) {
    prepared.bonusPercent = payload.bonusPercent ?? null;
  }
  if ('maxBonusUsd' in payload) {
    prepared.maxBonusUsd = payload.maxBonusUsd ?? null;
  }
  if ('expiryDate' in payload) {
    prepared.expiryDate = payload.expiryDate ?? null;
  }
  if ('eligibility' in payload) prepared.eligibility = payload.eligibility;
  if ('status' in payload) prepared.status = payload.status;
  if ('claimsTotal' in payload) {
    const claimsTotal = nullableNumber(
      (payload as { claimsTotal?: unknown }).claimsTotal,
    );
    if (typeof claimsTotal === 'number') {
      prepared.claimsTotal = claimsTotal;
    }
  }
  if ('claimsWeek' in payload) {
    const claimsWeek = nullableNumber(
      (payload as { claimsWeek?: unknown }).claimsWeek,
    );
    if (typeof claimsWeek === 'number') {
      prepared.claimsWeek = claimsWeek;
    }
  }

  return prepared;
}

export function mapBonusDefaults(
  entity: BonusDefaultEntity | null,
  fallback: BonusDefaultsResponse,
): BonusDefaultsResponse {
  if (!entity) {
    return { ...fallback };
  }

  return BonusDefaultsResponseSchema.parse(mapBonusBaseFields(entity));
}

export function toBonusDefaultsInput(
  payload: BonusDefaultsRequest,
): Partial<BonusDefaultEntity> {
  return {
    name: payload.name,
    type: payload.type,
    description: payload.description,
    bonusPercent: payload.bonusPercent ?? null,
    maxBonusUsd: payload.maxBonusUsd ?? null,
    expiryDate: payload.expiryDate ?? null,
    eligibility: payload.eligibility,
    status: payload.status,
  };
}
