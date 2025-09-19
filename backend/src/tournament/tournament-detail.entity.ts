import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Tournament } from '../database/entities/tournament.entity';

export enum TournamentDetailType {
  OVERVIEW = 'overview',
  STRUCTURE = 'structure',
  PRIZES = 'prizes',
}

@Entity({ name: 'tournament_details' })
@Index(['tournamentId'])
@Index(['type'])
export class TournamentDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tournament, (tournament) => tournament.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @RelationId((detail: TournamentDetail) => detail.tournament)
  tournamentId: string;

  @Column({
    type: 'enum',
    enum: TournamentDetailType,
  })
  type: TournamentDetailType;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;
}
