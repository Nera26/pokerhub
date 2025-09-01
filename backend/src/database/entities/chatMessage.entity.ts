import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Table } from './table.entity';
import { User } from './user.entity';

@Entity('chat_message')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  message!: string;

  @ManyToOne(() => Table, { onDelete: 'CASCADE' })
  table!: Table;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
