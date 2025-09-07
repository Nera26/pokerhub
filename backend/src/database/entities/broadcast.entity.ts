import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'broadcast' })
export class BroadcastEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column('text')
  text: string;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ default: false })
  urgent: boolean;
}
