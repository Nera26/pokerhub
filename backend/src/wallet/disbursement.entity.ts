import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Disbursement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @Column({ type: 'int' })
  amount: number;

  @Column()
  @Index({ unique: true })
  idempotencyKey: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'completed';

  @Column({ nullable: true })
  providerRef?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  completedAt?: Date;
}
