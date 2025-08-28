import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Table } from './table.entity';
import { Seat } from './seat.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  avatarKey?: string;

  @ManyToMany(() => Table, (table) => table.players)
  tables: Table[];

  @OneToMany(() => Seat, (seat) => seat.user)
  seats: Seat[];
}
