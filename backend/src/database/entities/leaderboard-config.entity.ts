import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'leaderboard_config' })
export class LeaderboardConfig {
  @PrimaryColumn('text')
  range: string;

  @PrimaryColumn('text')
  mode: string;
}
