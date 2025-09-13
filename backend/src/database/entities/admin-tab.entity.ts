import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'admin_tab' })
export class AdminTabEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  label: string;

  @Column()
  icon: string;

  @Column()
  component: string;
}
