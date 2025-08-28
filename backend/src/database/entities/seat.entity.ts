import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Table } from './table.entity';
import { User } from './user.entity';

@Entity()
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  position: number;

  @ManyToOne(() => Table, (table) => table.seats, { onDelete: 'CASCADE' })
  table: Table;

  @ManyToOne(() => User, (user) => user.seats, { nullable: false })
  user: User;

  @Column({ type: 'int', default: 0 })
  lastMovedHand: number;
}
