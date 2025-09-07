import { MigrationInterface, QueryRunner } from "typeorm";

export class Broadcasts1756798403182 implements MigrationInterface {
    name = 'Broadcasts1756798403182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "broadcast" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "text" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "urgent" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_broadcast" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "broadcast"`);
    }
}
