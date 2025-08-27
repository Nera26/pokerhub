import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => Account, (account) => account.entries, { onDelete: 'CASCADE' })
  account: Account;

  @Column({ type: 'int' })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}
