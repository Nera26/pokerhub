import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('default_avatar')
export class DefaultAvatarEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;
}
