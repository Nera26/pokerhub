import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'nav_icons' })
export class NavIconEntity {
  @PrimaryColumn({ type: 'varchar' })
  name: string;

  @Column('text')
  svg: string;
}
