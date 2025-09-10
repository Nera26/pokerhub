import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bonus_option')
export class BonusOptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  type: string | null;

  @Column({ type: 'varchar', nullable: true })
  eligibility: string | null;

  @Column({ type: 'varchar', nullable: true })
  status: string | null;

  @Column({ type: 'varchar' })
  label: string;
}
