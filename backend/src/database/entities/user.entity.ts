import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Table } from './table.entity';
import { Seat } from './seat.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  avatarKey?: string;

  @Column({ default: false })
  banned: boolean;

  @Column({ type: 'integer', default: 0 })
  balance: number;

  @ManyToMany(() => Table, (table) => table.players)
  tables: Table[];

  @OneToMany(() => Seat, (seat) => seat.user)
  seats: Seat[];
}
