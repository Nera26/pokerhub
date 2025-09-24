import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'game_history' })
export class GameHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column()
  stakes: string;

  @Column()
  buyin: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ default: false })
  profit: boolean;

  @Column()
  amount: string;
}

@Entity({ name: 'tournament_history' })
export class TournamentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  place: string;

  @Column()
  buyin: string;

  @Column()
  prize: string;

  @Column()
  duration: string;
}

@Entity({ name: 'wallet_history' })
export class WalletHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column()
  type: string;

  @Column()
  amount: string;

  @Column()
  status: string;
}

@Entity({ name: 'tournament_bracket' })
@Unique('UQ_tournament_bracket_tournament_id', ['tournamentId'])
export class TournamentBracket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tournamentId: string;

  @Index('IDX_tournament_bracket_user_id')
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  rounds: unknown;
}

