import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749004624822 implements MigrationInterface {
    name = 'Migration1749004624822'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "conversations_user_id_fkey"`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" SERIAL NOT NULL, "platform" character varying(255) NOT NULL, "external_id" character varying(255) NOT NULL, "name" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "shopId" uuid, CONSTRAINT "UQ_d65f8fc92eb72b5a678084397e4" UNIQUE ("platform"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "conversation_customers" ("conversation_id" integer NOT NULL, "customer_id" integer NOT NULL, CONSTRAINT "PK_ea3691e7156ed0eccd83d81f278" PRIMARY KEY ("conversation_id", "customer_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d7482c297c9bc0fa71d740ad9d" ON "conversation_customers" ("conversation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e9e1593ae867fb47588dc0761" ON "conversation_customers" ("customer_id") `);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "channel" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "extra_data"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "extra_data" jsonb`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "token_usage"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "token_usage" jsonb`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_type"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_45135fa52dfd3223f9b1fb62396" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_customers" ADD CONSTRAINT "FK_d7482c297c9bc0fa71d740ad9d6" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "conversation_customers" ADD CONSTRAINT "FK_7e9e1593ae867fb47588dc07610" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_customers" DROP CONSTRAINT "FK_7e9e1593ae867fb47588dc07610"`);
        await queryRunner.query(`ALTER TABLE "conversation_customers" DROP CONSTRAINT "FK_d7482c297c9bc0fa71d740ad9d6"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_45135fa52dfd3223f9b1fb62396"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."conversation_type" AS ENUM('direct', 'group')`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "type" "public"."conversation_type" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "token_usage"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "token_usage" text`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "extra_data"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "extra_data" text`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "channel"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e9e1593ae867fb47588dc0761"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d7482c297c9bc0fa71d740ad9d"`);
        await queryRunner.query(`DROP TABLE "conversation_customers"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
