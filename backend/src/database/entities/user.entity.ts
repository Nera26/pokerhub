import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Table } from './table.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @ManyToMany(() => Table, (table) => table.players)
  tables: Table[];
}
