import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('bonus')
export class BonusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'double precision', nullable: true })
  bonusPercent: number | null;

  @Column({ type: 'double precision', nullable: true })
  maxBonusUsd: number | null;

  @Column({ type: 'date', nullable: true })
  expiryDate: string | null;

  @Column({ type: 'varchar' })
  eligibility: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'integer', default: 0 })
  claimsTotal: number;

  @Column({ type: 'integer', default: 0 })
  claimsWeek: number;
}
