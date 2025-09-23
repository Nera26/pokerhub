import { Column, Entity, PrimaryColumn } from 'typeorm';

export type PerformanceThresholdMetric = 'INP' | 'LCP' | 'CLS';

@Entity('performance_threshold')
export class PerformanceThresholdEntity {
  @PrimaryColumn({ type: 'varchar' })
  metric: PerformanceThresholdMetric;

  @Column('double precision')
  value: number;
}
