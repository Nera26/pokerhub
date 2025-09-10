import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChipDenominationEntity } from '../database/entities/chip-denomination.entity';

@Injectable()
export class ChipDenomsService {
  constructor(
    @InjectRepository(ChipDenominationEntity)
    private readonly repo: Repository<ChipDenominationEntity>,
  ) {}

  async get(): Promise<number[]> {
    const rows = await this.repo.find({ order: { value: 'DESC' } });
    return rows.map((r) => r.value);
  }

  async update(denoms: number[]): Promise<number[]> {
    await this.repo.clear();
    if (denoms.length) {
      await this.repo.insert(denoms.map((value) => ({ value })));
    }
    return this.get();
  }
}
