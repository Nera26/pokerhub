import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { TournamentFilter } from '@shared/types';

@Entity({ name: 'tournament_filter_options' })
export class TournamentFilterOptionEntity {
  @PrimaryColumn({ type: 'varchar' })
  value: TournamentFilter;

  @Column({ type: 'varchar' })
  label: string;
}
