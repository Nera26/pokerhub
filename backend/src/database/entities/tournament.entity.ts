import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Table } from './table.entity';

export enum TournamentState {
  REG_OPEN = 'REG_OPEN',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('int')
  buyIn: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column('int')
  prizePool: number;

  @Column('int')
  maxPlayers: number;

  @Column({
    type: 'enum',
    enum: TournamentState,
    default: TournamentState.REG_OPEN,
  })
  state: TournamentState;

  @Column({ type: 'timestamptz', nullable: true })
  registrationOpen?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  registrationClose?: Date;

  @OneToMany(() => Table, (table) => table.tournament)
  tables: Table[];
}
