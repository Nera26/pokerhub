import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class CTA {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  label: string;

  @Column()
  href: string;

  @Column({ type: 'varchar' })
  variant: string;
}

