import { Entity, PrimaryColumn, Column } from 'typeorm';

export interface CollusionHistoryEntry {
  action: 'warn' | 'restrict' | 'ban';
  timestamp: number;
  reviewerId: string;
}

@Entity('collusion_audit')
export class CollusionAudit {
  @PrimaryColumn()
  sessionId: string;

  @Column('jsonb')
  users: string[];

  @Column({ default: 'flagged' })
  status: 'flagged' | 'warn' | 'restrict' | 'ban';

  @Column('jsonb', { nullable: true })
  features?: Record<string, unknown> | null;

  @Column('jsonb', { default: () => "'[]'::jsonb" })
  history: CollusionHistoryEntry[];
}

export default CollusionAudit;
