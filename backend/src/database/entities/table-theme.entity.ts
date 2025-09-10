import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { TableThemeResponse } from '@shared/types';

@Entity('table_theme')
export class TableThemeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hairline: string;

  @Column({ type: 'jsonb' })
  positions: TableThemeResponse['positions'];
}
