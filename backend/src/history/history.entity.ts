import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

