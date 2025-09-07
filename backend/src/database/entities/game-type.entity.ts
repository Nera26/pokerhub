import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class GameType {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  label: string;
}
