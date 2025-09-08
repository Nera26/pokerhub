import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { Promotion } from '@shared/types';

@Entity({ name: 'promotions' })
export class PromotionEntity implements Promotion {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  category: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  reward: string;

  @Column({ nullable: true })
  unlockText?: string;

  @Column({ nullable: true })
  statusText?: string;

  @Column({ type: 'json', nullable: true })
  progress?: Promotion['progress'];

  @Column({ type: 'json' })
  breakdown: Promotion['breakdown'];

  @Column({ nullable: true })
  eta?: string;
}

