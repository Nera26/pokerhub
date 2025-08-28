import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum AntiCheatAction {
  WARN = 'warn',
  RESTRICT = 'restrict',
  BAN = 'ban',
}

@Entity()
export class AntiCheatFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column()
  reason: string;

  @Column({ type: 'enum', enum: AntiCheatAction, default: AntiCheatAction.WARN })
  action: AntiCheatAction;

  @CreateDateColumn()
  createdAt: Date;
}
