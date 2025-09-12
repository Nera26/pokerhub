import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('transaction_tab')
export class TransactionTabEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  label: string;
}
