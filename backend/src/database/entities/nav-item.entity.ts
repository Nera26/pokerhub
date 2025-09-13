import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'nav_items' })
export class NavItemEntity {
  @PrimaryColumn({ type: 'varchar' })
  flag: string;

  @Column({ type: 'varchar' })
  href: string;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'varchar', nullable: true })
  icon: string | null;

  @Column('int')
  order: number;
}
