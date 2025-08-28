import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Tournament } from './tournament.entity';
import { User } from './user.entity';
import { Seat } from './seat.entity';

@Entity()
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Tournament, (tournament) => tournament.tables, {
    nullable: false,
  })
  tournament: Tournament;

  @ManyToMany(() => User, (user) => user.tables)
  @JoinTable()
  players: User[];

  @OneToMany(() => Seat, (seat) => seat.table)
  seats: Seat[];
}
