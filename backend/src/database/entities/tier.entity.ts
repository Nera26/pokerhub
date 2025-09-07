import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Tier {
  @PrimaryColumn({ type: 'varchar' })
  name: string;

  @Column('int')
  min: number;

  @Column('int', { nullable: true })
  max: number | null;
}
