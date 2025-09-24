import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'admin_tournament_filters' })
export class AdminTournamentFilterEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ name: 'color_class', type: 'varchar', nullable: true })
  colorClass?: string | null;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder: number;
}
