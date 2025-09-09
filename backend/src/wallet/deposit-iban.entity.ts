import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'deposit_iban' })
export class DepositIban {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  iban: string;

  @Column()
  masked: string;

  @Column()
  holder: string;

  @Column()
  instructions: string;

  @Column()
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
