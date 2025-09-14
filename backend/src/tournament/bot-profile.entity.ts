import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class BotProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('float')
  proportion: number;

  @Column('float')
  bustMultiplier: number;
}
