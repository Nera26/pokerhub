import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('audit_log_type_class_default')
export class AuditLogTypeClassDefault {
  @PrimaryColumn()
  type: string;

  @Column()
  className: string;
}
