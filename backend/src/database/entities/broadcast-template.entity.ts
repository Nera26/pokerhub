import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'broadcast_template' })
export class BroadcastTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  text: string;
}

