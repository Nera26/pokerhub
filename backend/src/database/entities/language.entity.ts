import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'languages' })
export class LanguageEntity {
  @PrimaryColumn({ type: 'varchar' })
  code: string;

  @Column()
  label: string;
}
