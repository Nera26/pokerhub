import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'translations' })
export class TranslationEntity {
  @PrimaryColumn({ type: 'varchar' })
  lang: string;

  @PrimaryColumn({ type: 'varchar' })
  key: string;

  @Column('text')
  value: string;
}
