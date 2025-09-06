import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'pep_list' })
export class Pep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;
}
