import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('hand')
export class Hand {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text')
  log!: string;

  @Column()
  commitment!: string;

  @Column('varchar', { nullable: true })
  seed!: string | null;

  @Column('varchar', { nullable: true })
  nonce!: string | null;

  @Column({ default: false })
  settled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
