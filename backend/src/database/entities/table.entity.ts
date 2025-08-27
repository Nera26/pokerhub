import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Tournament } from './tournament.entity';
import { User } from './user.entity';

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
}
