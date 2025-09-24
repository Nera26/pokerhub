import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditLogTypeClassDefault1758800000000 implements MigrationInterface {
    name = 'AuditLogTypeClassDefault1758800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_log_type_class_default" ("type" character varying NOT NULL, "className" character varying NOT NULL, CONSTRAINT "PK_audit_log_type_class_default_type" PRIMARY KEY ("type"))`);
        await queryRunner.query(`INSERT INTO "audit_log_type_class_default" ("type", "className") VALUES
            ('Login', 'bg-accent-green/20 text-accent-green'),
            ('Error', 'bg-danger-red/20 text-danger-red'),
            ('Broadcast', 'bg-accent-yellow/20 text-accent-yellow'),
            ('Security Alert', 'bg-danger-red/20 text-danger-red')
        ON CONFLICT ("type") DO NOTHING`);
        await queryRunner.query(`DELETE FROM "audit_log_type_class" WHERE "type" IN ('Login', 'Error', 'Broadcast', 'Security Alert')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "audit_log_type_class" ("type", "className")
            SELECT "type", "className"
            FROM "audit_log_type_class_default"
            WHERE "type" IN ('Login', 'Error', 'Broadcast', 'Security Alert')
        ON CONFLICT ("type") DO NOTHING`);
        await queryRunner.query(`DROP TABLE "audit_log_type_class_default"`);
    }
}
