import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../../wallet/account.entity';

@Entity({ name: 'kyc_verification' })
export class KycVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  account: Account;

  @Column()
  provider: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'verified' | 'failed';

  @Column({ type: 'int', default: 0 })
  retries: number;

  @Column({ type: 'simple-json', nullable: true })
  result?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
