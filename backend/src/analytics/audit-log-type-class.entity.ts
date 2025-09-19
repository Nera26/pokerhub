import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('audit_log_type_class')
export class AuditLogTypeClass {
  @PrimaryColumn()
  type: string;

  @Column()
  className: string;
}
