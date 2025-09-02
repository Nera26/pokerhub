import { MigrationInterface, QueryRunner } from "typeorm";

export class NewEntities1756798403170 implements MigrationInterface {
    name = 'NewEntities1756798403170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tournament_state_enum" AS ENUM('REG_OPEN', 'RUNNING', 'PAUSED', 'FINISHED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "tournament" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "buyIn" integer NOT NULL, "prizePool" integer NOT NULL, "maxPlayers" integer NOT NULL, "state" "public"."tournament_state_enum" NOT NULL DEFAULT 'REG_OPEN', "registrationOpen" TIMESTAMP WITH TIME ZONE, "registrationClose" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_449f912ba2b62be003f0c22e767" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "seat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "position" integer NOT NULL, "lastMovedHand" integer NOT NULL DEFAULT '0', "tableId" uuid, "userId" uuid NOT NULL, CONSTRAINT "PK_4e72ae40c3fbd7711ccb380ac17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying, "password" character varying, "avatarKey" character varying, "banned" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "table" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "gameType" character varying NOT NULL DEFAULT 'texas', "smallBlind" integer NOT NULL, "bigBlind" integer NOT NULL, "startingStack" integer NOT NULL, "playersCurrent" integer NOT NULL DEFAULT '0', "playersMax" integer NOT NULL, "minBuyIn" integer NOT NULL, "maxBuyIn" integer NOT NULL, "handsPerHour" integer NOT NULL DEFAULT '0', "avgPot" integer NOT NULL DEFAULT '0', "rake" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "tournamentId" uuid, CONSTRAINT "PK_28914b55c485fc2d7a101b1b2a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "journal_entry" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "amount" integer NOT NULL, "currency" character varying(3) NOT NULL, "refType" character varying NOT NULL, "refId" character varying NOT NULL, "providerTxnId" character varying, "providerStatus" character varying, "hash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_69167f660c807d2aa178f0bd7e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c99ea765dd8478d7838aa2ff91" ON "journal_entry" ("hash") `);
        await queryRunner.query(`CREATE TABLE "account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "currency" character varying(3) NOT NULL, "balance" integer NOT NULL DEFAULT '0', "creditBalance" integer NOT NULL DEFAULT '0', "kycVerified" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d4a19e7dc60ccc27442fda21ea" ON "account" ("name", "currency") `);
        await queryRunner.query(`CREATE TABLE "settlement_journal" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idempotencyKey" character varying NOT NULL, "status" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c87039e5ecd81c13d2d0f9d7b11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_997cc838685153b89b31bb31f4" ON "settlement_journal" ("idempotencyKey") `);
        await queryRunner.query(`CREATE TABLE "disbursement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" character varying NOT NULL, "amount" integer NOT NULL, "idempotencyKey" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "providerRef" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP, CONSTRAINT "PK_463ed35f32b733386261ab7d7fa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3dc09c418515be57bee870cfca" ON "disbursement" ("idempotencyKey") `);
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "type" character varying NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "read" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1ced25315eb974b73391fb1c81" ON "notification" ("userId") `);
        await queryRunner.query(`CREATE TABLE "withdrawal_decision" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "reviewerId" character varying NOT NULL, "comment" text, "status" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_072e8bbd35c6519bcc6cc0143ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "hand" ("id" uuid NOT NULL, "log" text NOT NULL, "commitment" character varying NOT NULL, "seed" character varying, "nonce" character varying, "settled" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e123b9098c1fefd441b6c78b872" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."anti_cheat_flag_action_enum" AS ENUM('warn', 'restrict', 'ban')`);
        await queryRunner.query(`CREATE TABLE "anti_cheat_flag" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reason" character varying NOT NULL, "action" "public"."anti_cheat_flag_action_enum" NOT NULL DEFAULT 'warn', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_a0a85dac292f2ef45a4a96dc7fa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "kyc_verification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "provider" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "retries" integer NOT NULL DEFAULT '0', "result" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7e6bb03acdd29ae284cd46ab05a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_message" ("id" SERIAL NOT NULL, "message" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "tableId" uuid, "userId" uuid, CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game_state" ("id" SERIAL NOT NULL, "tableId" character varying NOT NULL, "tick" integer NOT NULL, "state" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e7b8f9fb87d56841a7aaa284f52" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "table_players_user" ("tableId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_4b5e8eb77676f2823b69a3e294c" PRIMARY KEY ("tableId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c6b4b60b1bdefc373dcfe1abe0" ON "table_players_user" ("tableId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b6091c591c8877232d4e3e1840" ON "table_players_user" ("userId") `);
        await queryRunner.query(`ALTER TABLE "seat" ADD CONSTRAINT "FK_4137c232ccc9d29e96817d70b35" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "seat" ADD CONSTRAINT "FK_759dded19d4482b7baa40585c38" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "table" ADD CONSTRAINT "FK_ebba254629bf4ed1f1c156cb35d" FOREIGN KEY ("tournamentId") REFERENCES "tournament"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journal_entry" ADD CONSTRAINT "FK_5eb980cfdd7c2a31dad9cc7ab49" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "anti_cheat_flag" ADD CONSTRAINT "FK_945bad43a3f8d15c70ba0f281a2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "kyc_verification" ADD CONSTRAINT "FK_487dd638ddf7083c97c315c4d5b" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_b697dffb274e3250e319293ef08" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_a44ec486210e6f8b4591776d6f3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "table_players_user" ADD CONSTRAINT "FK_c6b4b60b1bdefc373dcfe1abe0a" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "table_players_user" ADD CONSTRAINT "FK_b6091c591c8877232d4e3e18407" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "table_players_user" DROP CONSTRAINT "FK_b6091c591c8877232d4e3e18407"`);
        await queryRunner.query(`ALTER TABLE "table_players_user" DROP CONSTRAINT "FK_c6b4b60b1bdefc373dcfe1abe0a"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_a44ec486210e6f8b4591776d6f3"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_b697dffb274e3250e319293ef08"`);
        await queryRunner.query(`ALTER TABLE "kyc_verification" DROP CONSTRAINT "FK_487dd638ddf7083c97c315c4d5b"`);
        await queryRunner.query(`ALTER TABLE "anti_cheat_flag" DROP CONSTRAINT "FK_945bad43a3f8d15c70ba0f281a2"`);
        await queryRunner.query(`ALTER TABLE "journal_entry" DROP CONSTRAINT "FK_5eb980cfdd7c2a31dad9cc7ab49"`);
        await queryRunner.query(`ALTER TABLE "table" DROP CONSTRAINT "FK_ebba254629bf4ed1f1c156cb35d"`);
        await queryRunner.query(`ALTER TABLE "seat" DROP CONSTRAINT "FK_759dded19d4482b7baa40585c38"`);
        await queryRunner.query(`ALTER TABLE "seat" DROP CONSTRAINT "FK_4137c232ccc9d29e96817d70b35"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b6091c591c8877232d4e3e1840"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c6b4b60b1bdefc373dcfe1abe0"`);
        await queryRunner.query(`DROP TABLE "table_players_user"`);
        await queryRunner.query(`DROP TABLE "game_state"`);
        await queryRunner.query(`DROP TABLE "chat_message"`);
        await queryRunner.query(`DROP TABLE "kyc_verification"`);
        await queryRunner.query(`DROP TABLE "anti_cheat_flag"`);
        await queryRunner.query(`DROP TYPE "public"."anti_cheat_flag_action_enum"`);
        await queryRunner.query(`DROP TABLE "hand"`);
        await queryRunner.query(`DROP TABLE "withdrawal_decision"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ced25315eb974b73391fb1c81"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3dc09c418515be57bee870cfca"`);
        await queryRunner.query(`DROP TABLE "disbursement"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_997cc838685153b89b31bb31f4"`);
        await queryRunner.query(`DROP TABLE "settlement_journal"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d4a19e7dc60ccc27442fda21ea"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c99ea765dd8478d7838aa2ff91"`);
        await queryRunner.query(`DROP TABLE "journal_entry"`);
        await queryRunner.query(`DROP TABLE "table"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "seat"`);
        await queryRunner.query(`DROP TABLE "tournament"`);
        await queryRunner.query(`DROP TYPE "public"."tournament_state_enum"`);
    }

}
