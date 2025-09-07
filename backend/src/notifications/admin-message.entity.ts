import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('admin_messages')
export class AdminMessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sender: string;

  @Column()
  userId: string;

  @Column()
  avatar: string;

  @Column()
  subject: string;

  @Column()
  preview: string;

  @Column('text')
  content: string;

  @Column({ type: 'timestamptz' })
  time: Date;

  @Column({ default: false })
  read: boolean;
}

