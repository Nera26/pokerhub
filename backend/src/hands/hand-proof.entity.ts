import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class HandProofEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  commitment: string;

  @Column({ nullable: true })
  seed?: string;

  @Column({ nullable: true })
  nonce?: string;

  @Column({ type: 'jsonb', nullable: true })
  log?: unknown;
}
