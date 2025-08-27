import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Table } from './table.entity';

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @OneToMany(() => Table, (table) => table.tournament)
  tables: Table[];
}
