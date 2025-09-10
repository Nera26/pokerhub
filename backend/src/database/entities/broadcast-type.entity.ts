import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'broadcast_type' })
export class BroadcastTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('text')
  icon: string;

  @Column('text')
  color: string;
}
