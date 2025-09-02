import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Leaderboard {
  @PrimaryColumn('uuid')
  playerId: string;

  @Column()
  rank: number;

  @Column('float')
  rating: number;

  @Column('float')
  rd: number;

  @Column('float')
  volatility: number;

  @Column('integer')
  net: number;

  @Column('float')
  bb: number;

  @Column('integer')
  hands: number;

  @Column('integer')
  duration: number;

  @Column('integer')
  buyIn: number;

  @Column('jsonb', { default: {}, nullable: false })
  finishes: Record<number, number>;
}
