import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { JournalEntry } from './journal-entry.entity';

@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'int', default: 0 })
  balance: number;

  @Column({ type: 'boolean', default: false })
  kycVerified: boolean;

  @OneToMany(() => JournalEntry, (entry) => entry.account)
  entries: JournalEntry[];
}
