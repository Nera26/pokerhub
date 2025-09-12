import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('transaction_status')
export class TransactionStatus {
  @PrimaryColumn()
  id: string;

  @Column()
  label: string;

  @Column()
  style: string;
}
