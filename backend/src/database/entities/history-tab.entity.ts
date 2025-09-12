import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('history_tab')
export class HistoryTabEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column()
  label: string;

  @Column('int')
  order: number;
}
