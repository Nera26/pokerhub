import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('game_state')
export class GameState {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  tableId!: string;

  @Column()
  tick!: number;

  @Column('jsonb')
  state!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}

