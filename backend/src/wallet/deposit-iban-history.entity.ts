import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'deposit_iban_history' })
export class DepositIbanHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  date: Date;

  @Column()
  oldIban: string;

  @Column()
  newIban: string;

  @Column()
  by: string;

  @Column()
  notes: string;
}
