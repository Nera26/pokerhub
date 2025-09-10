import { MigrationInterface, QueryRunner } from "typeorm";

export class Broadcasts1756798403182 implements MigrationInterface {
    name = 'Broadcasts1756798403182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "broadcast" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "text" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "urgent" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_broadcast" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "broadcast_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "icon" text NOT NULL, "color" text NOT NULL, CONSTRAINT "PK_broadcast_type" PRIMARY KEY ("id"), CONSTRAINT "UQ_broadcast_type_name" UNIQUE ("name"))`);
        await queryRunner.query(`INSERT INTO "broadcast_type" ("name", "icon", "color") VALUES ('announcement','📢','text-accent-yellow'), ('alert','⚠️','text-danger-red'), ('notice','ℹ️','text-accent-blue')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "broadcast_type"`);
        await queryRunner.query(`DROP TABLE "broadcast"`);
    }
}
