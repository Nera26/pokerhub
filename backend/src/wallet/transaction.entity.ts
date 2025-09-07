import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TransactionType } from './transaction-type.entity';

@Entity('wallet_transaction')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  typeId: string;

  @ManyToOne(() => TransactionType, { eager: true })
  @JoinColumn({ name: 'typeId' })
  type: TransactionType;

  @Column({ type: 'int' })
  amount: number;

  @Column()
  performedBy: string;

  @Column()
  notes: string;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
