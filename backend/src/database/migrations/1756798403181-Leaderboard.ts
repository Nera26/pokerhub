import { MigrationInterface, QueryRunner } from "typeorm";

export class Leaderboard1756798403181 implements MigrationInterface {
    name = 'Leaderboard1756798403181'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "leaderboard" ("playerId" uuid NOT NULL, "rank" integer NOT NULL, "rating" double precision NOT NULL, "rd" double precision NOT NULL, "volatility" double precision NOT NULL, "net" integer NOT NULL, "bb" double precision NOT NULL, "hands" integer NOT NULL, "duration" integer NOT NULL, "buyIn" integer NOT NULL, "finishes" jsonb NOT NULL DEFAULT '{}'::jsonb, CONSTRAINT "PK_leaderboard_player" PRIMARY KEY ("playerId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "leaderboard"`);
    }
}
