import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'leaderboard_config' })
export class LeaderboardConfigEntity {
  @PrimaryColumn('text')
  range: string;

  @PrimaryColumn('text')
  mode: string;
}
