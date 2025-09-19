import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditLogTypeClass1756798404000 implements MigrationInterface {
    name = 'AuditLogTypeClass1756798404000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_log_type_class" ("type" character varying NOT NULL, "className" character varying NOT NULL, CONSTRAINT "PK_audit_log_type_class_type" PRIMARY KEY ("type"))`);
        await queryRunner.query(`INSERT INTO "audit_log_type_class" ("type", "className") VALUES
            ('Login', 'bg-accent-green/20 text-accent-green'),
            ('Error', 'bg-danger-red/20 text-danger-red'),
            ('Broadcast', 'bg-accent-yellow/20 text-accent-yellow'),
            ('Security Alert', 'bg-danger-red/20 text-danger-red')
        ON CONFLICT ("type") DO NOTHING`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "audit_log_type_class"`);
    }
}
