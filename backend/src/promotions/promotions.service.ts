import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { MessageResponse, Promotion } from '@shared/types';
import { PromotionEntity } from '../database/entities/promotion.entity';
import { PromotionClaimEntity } from '../database/entities/promotion-claim.entity';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(PromotionEntity)
    private readonly repo: Repository<PromotionEntity>,
    @InjectRepository(PromotionClaimEntity)
    private readonly claims: Repository<PromotionClaimEntity>,
  ) {}

  async findAll(): Promise<Promotion[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Promotion | null> {
    return this.repo.findOne({ where: { id } });
  }

  async claim(id: string, userId: string): Promise<MessageResponse> {
    const promotion = await this.repo.findOne({ where: { id } });
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    const alreadyClaimed = await this.claims.findOne({
      where: { promotionId: id, userId },
    });

    if (alreadyClaimed) {
      throw new ConflictException('Promotion already claimed');
    }

    await this.claims.insert({ promotionId: id, userId });

    return {
      message: `Promotion "${promotion.title}" claimed`,
    };
  }
}

