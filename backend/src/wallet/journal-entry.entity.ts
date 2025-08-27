import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
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

  @Column()
  refType: string;

  @Column()
  refId: string;

  @Column()
  @Index({ unique: true })
  hash: string;

  @CreateDateColumn()
  createdAt: Date;
}
