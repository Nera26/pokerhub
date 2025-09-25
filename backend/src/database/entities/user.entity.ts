import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Table } from './table.entity';
import { Seat } from './seat.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: 'Player' })
  role: 'Player' | 'Admin';

  @Column({ nullable: true })
  avatarKey?: string;

  @Column({ default: false })
  banned: boolean;

  @Column({ nullable: true })
  bank?: string;

  @Column({ nullable: true })
  location?: string;

  @CreateDateColumn()
  joined: Date;

  @Column({ nullable: true })
  bio?: string;

  @Column('int', { default: 0 })
  experience: number;

  @Column('int', { default: 0 })
  balance: number;

  @ManyToMany(() => Table, (table) => table.players)
  tables: Table[];

  @OneToMany(() => Seat, (seat) => seat.user)
  seats: Seat[];
}
