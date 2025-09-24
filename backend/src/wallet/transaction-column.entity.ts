import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('transaction_column')
export class TransactionColumnEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  label: string;

  @Column({ type: 'int' })
  position: number;
}
