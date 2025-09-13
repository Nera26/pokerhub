import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Tournament } from './tournament.entity';
import { User } from './user.entity';
import { Seat } from './seat.entity';
import type { TabKey } from '../../schemas/tables';

@Entity()
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 'texas' })
  gameType: string;

  @Column('int')
  smallBlind: number;

  @Column('int')
  bigBlind: number;

  @Column('int')
  startingStack: number;

  @Column('int', { default: 0 })
  playersCurrent: number;

  @Column('int')
  playersMax: number;

  @Column('int')
  minBuyIn: number;

  @Column('int')
  maxBuyIn: number;

  @Column('int', { default: 0 })
  handsPerHour: number;

  @Column('int', { default: 0 })
  avgPot: number;

  @Column('int', { default: 0 })
  rake: number;

  @Column('text', {
    array: true,
    default: ['history', 'chat', 'notes'],
  })
  tabs: TabKey[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Tournament, (tournament) => tournament.tables, {
    nullable: true,
  })
  tournament?: Tournament;

  @ManyToMany(() => User, (user) => user.tables)
  @JoinTable()
  players: User[];

  @OneToMany(() => Seat, (seat) => seat.table)
  seats: Seat[];
}
