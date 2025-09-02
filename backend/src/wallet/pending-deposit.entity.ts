import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class PendingDeposit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'int' })
  amount: number;

  @Column()
  @Index({ unique: true })
  reference: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'rejected';

  @Column({ default: false })
  actionRequired: boolean;

  @Column({ nullable: true })
  confirmedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt?: Date;

  @Column({ nullable: true })
  rejectedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
