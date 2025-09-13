import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('chart_palette')
export class ChartPaletteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  color: string;
}
