import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { BlockedCountry } from '@shared/types';
import { BlockedCountryEntity } from '../database/entities/blocked-country.entity';
import { KycService } from '../common/kyc.service';

@Injectable()
export class BlockedCountriesService {
  constructor(
    @InjectRepository(BlockedCountryEntity)
    private readonly repo: Repository<BlockedCountryEntity>,
    private readonly kyc: KycService,
  ) {}

  private normalize(code: string): string {
    return code.trim().toUpperCase();
  }

  private toDto(entity: BlockedCountryEntity): BlockedCountry {
    return { country: entity.country };
  }

  async list(): Promise<BlockedCountry[]> {
    const rows = await this.repo.find({ order: { country: 'ASC' } });
    return rows.map((row) => this.toDto(row));
  }

  async create(country: string): Promise<BlockedCountry> {
    const normalized = this.normalize(country);
    const existing = await this.repo.findOne({ where: { country: normalized } });
    if (existing) {
      throw new ConflictException('Blocked country already exists');
    }
    const entity = this.repo.create({ country: normalized });
    const saved = await this.repo.save(entity);
    await this.kyc.refreshBlockedCountries();
    return this.toDto(saved);
  }

  async update(current: string, next: string): Promise<BlockedCountry> {
    const from = this.normalize(current);
    const to = this.normalize(next);
    const existing = await this.repo.findOne({ where: { country: from } });
    if (!existing) {
      throw new NotFoundException('Blocked country not found');
    }
    if (from !== to) {
      const duplicate = await this.repo.findOne({ where: { country: to } });
      if (duplicate) {
        throw new ConflictException('Blocked country already exists');
      }
      await this.repo.update({ country: from }, { country: to });
    }
    const updated = await this.repo.findOne({ where: { country: to } });
    if (!updated) {
      throw new NotFoundException('Blocked country not found');
    }
    await this.kyc.refreshBlockedCountries();
    return this.toDto(updated);
  }

  async remove(country: string): Promise<void> {
    const normalized = this.normalize(country);
    const result = await this.repo.delete({ country: normalized });
    if (!result.affected) {
      throw new NotFoundException('Blocked country not found');
    }
    await this.kyc.refreshBlockedCountries();
  }
}
