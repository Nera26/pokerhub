import { Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class BonusBaseEntity {
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
}
