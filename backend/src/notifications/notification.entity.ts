import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ default: false })
  read: boolean;
}

