import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PromotionEntity } from './promotion.entity';

@Entity({ name: 'promotion_claims' })
export class PromotionClaimEntity {
  @PrimaryColumn({ type: 'varchar' })
  promotionId: string;

  @PrimaryColumn({ type: 'varchar' })
  userId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  claimedAt: Date;

  @ManyToOne(() => PromotionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promotionId', referencedColumnName: 'id' })
  promotion?: PromotionEntity;
}
