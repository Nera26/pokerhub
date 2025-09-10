import { MigrationInterface, QueryRunner } from "typeorm";

export class BroadcastTemplates1756798403193 implements MigrationInterface {
    name = 'BroadcastTemplates1756798403193'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "broadcast_template" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "text" text NOT NULL, CONSTRAINT "PK_broadcast_template" PRIMARY KEY ("id"))`);
        await queryRunner.query(`INSERT INTO "broadcast_template" ("name", "text") VALUES ('maintenance', 'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.'), ('tournament', 'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "broadcast_template"`);
    }
}
