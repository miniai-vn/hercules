import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1750926088581 implements MigrationInterface {
    name = 'Migration1750926088581'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_34671d2386b947862a983242491"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_16f3639f33054083eb7a458cd0f"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_edf33f6c237b06704f3d57542cd"`);
        await queryRunner.query(`CREATE TABLE "agents" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "model_provider" character varying(100) NOT NULL DEFAULT 'openai', "model_name" character varying(255) NOT NULL, "prompt" text NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'inactive', "model_config" json, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "shop_id" uuid, CONSTRAINT "PK_9c653f28ae19c5884d5baf6a1d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_agents" ("user_id" uuid NOT NULL, "agent_id" integer NOT NULL, CONSTRAINT "PK_40c52bdd3d79da89ef28007a3c2" PRIMARY KEY ("user_id", "agent_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7605f5a6905edbb1dd2e2e6892" ON "user_agents" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_77a6f598228a507996e3618cff" ON "user_agents" ("agent_id") `);
        await queryRunner.query(`ALTER TABLE "departments" DROP COLUMN "is_public"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP COLUMN "prompt"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "external_id" text`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "avatar" text`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "UQ_fc0741a526342c15788fe62c08e" UNIQUE ("channel_id", "external_id")`);
        await queryRunner.query(`ALTER TABLE "agents" ADD CONSTRAINT "FK_34578b618e78b8612844213902e" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_34671d2386b947862a983242491" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_16f3639f33054083eb7a458cd0f" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_edf33f6c237b06704f3d57542cd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_agents" ADD CONSTRAINT "FK_7605f5a6905edbb1dd2e2e68922" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_agents" ADD CONSTRAINT "FK_77a6f598228a507996e3618cffc" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_agents" DROP CONSTRAINT "FK_77a6f598228a507996e3618cffc"`);
        await queryRunner.query(`ALTER TABLE "user_agents" DROP CONSTRAINT "FK_7605f5a6905edbb1dd2e2e68922"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_edf33f6c237b06704f3d57542cd"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_16f3639f33054083eb7a458cd0f"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_34671d2386b947862a983242491"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90"`);
        await queryRunner.query(`ALTER TABLE "agents" DROP CONSTRAINT "FK_34578b618e78b8612844213902e"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "UQ_fc0741a526342c15788fe62c08e"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "avatar" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "external_id"`);
        await queryRunner.query(`ALTER TABLE "departments" ADD "prompt" character varying`);
        await queryRunner.query(`ALTER TABLE "departments" ADD "is_public" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77a6f598228a507996e3618cff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7605f5a6905edbb1dd2e2e6892"`);
        await queryRunner.query(`DROP TABLE "user_agents"`);
        await queryRunner.query(`DROP TABLE "agents"`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_edf33f6c237b06704f3d57542cd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_16f3639f33054083eb7a458cd0f" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_34671d2386b947862a983242491" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
