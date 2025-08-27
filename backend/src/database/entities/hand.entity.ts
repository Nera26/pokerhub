import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('hand')
export class Hand {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text')
  log!: string;

  @Column()
  commitment!: string;

  @Column({ nullable: true })
  seed!: string | null;

  @Column({ nullable: true })
  nonce!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
