import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'tournament_formats' })
export class TournamentFormatEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'int', name: 'sort_order' })
  sortOrder: number;
}
