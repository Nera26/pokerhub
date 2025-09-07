import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class TransactionType {
  @PrimaryColumn()
  id: string;

  @Column()
  label: string;
}
