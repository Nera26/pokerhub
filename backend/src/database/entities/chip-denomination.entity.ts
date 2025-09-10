import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('chip_denomination')
export class ChipDenominationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  value: number;
}
