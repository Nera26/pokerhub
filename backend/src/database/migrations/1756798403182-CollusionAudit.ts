import { MigrationInterface, QueryRunner } from "typeorm";

export class CollusionAudit1756798403182 implements MigrationInterface {
    name = 'CollusionAudit1756798403182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "collusion_audit" ("sessionId" character varying NOT NULL, "users" jsonb NOT NULL, "status" character varying NOT NULL DEFAULT 'flagged', "features" jsonb, "history" jsonb NOT NULL DEFAULT '[]', CONSTRAINT "PK_collusion_audit_sessionId" PRIMARY KEY ("sessionId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "collusion_audit"`);
    }
}
