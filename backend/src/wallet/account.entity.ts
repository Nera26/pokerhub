import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { JournalEntry } from './journal-entry.entity';

@Index(['name', 'currency'], { unique: true })
@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'int', default: 0 })
  balance: number;

  @Column({ type: 'boolean', default: false })
  kycVerified: boolean;

  @OneToMany(() => JournalEntry, (entry) => entry.account)
  entries: JournalEntry[];
}
