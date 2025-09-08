import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Promotion } from '@shared/types';
import { PromotionEntity } from '../database/entities/promotion.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(PromotionEntity)
    private readonly repo: Repository<PromotionEntity>,
  ) {}

  async findAll(): Promise<Promotion[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Promotion | null> {
    return this.repo.findOne({ where: { id } });
  }
}

