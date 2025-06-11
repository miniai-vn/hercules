import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749623868800 implements MigrationInterface {
    name = 'Migration1749623868800'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_34671d2386b947862a983242491"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_16f3639f33054083eb7a458cd0f"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_d65f8fc92eb72b5a678084397e4"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "PK_9a901d5bd72ef72cdc7f5acd9ea"`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "PK_edf33f6c237b06704f3d57542cd" PRIMARY KEY ("user_id")`);
        await queryRunner.query(`DROP INDEX "public"."IDX_16f3639f33054083eb7a458cd0"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP COLUMN "channel_id"`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD "channel_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "PK_edf33f6c237b06704f3d57542cd"`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "PK_9a901d5bd72ef72cdc7f5acd9ea" PRIMARY KEY ("user_id", "channel_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_16f3639f33054083eb7a458cd0" ON "user_channels" ("channel_id") `);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_34671d2386b947862a983242491" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_16f3639f33054083eb7a458cd0f" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_16f3639f33054083eb7a458cd0f"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_34671d2386b947862a983242491"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_16f3639f33054083eb7a458cd0"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "PK_9a901d5bd72ef72cdc7f5acd9ea"`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "PK_edf33f6c237b06704f3d57542cd" PRIMARY KEY ("user_id")`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP COLUMN "channel_id"`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD "channel_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_16f3639f33054083eb7a458cd0" ON "user_channels" ("channel_id") `);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "PK_edf33f6c237b06704f3d57542cd"`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "PK_9a901d5bd72ef72cdc7f5acd9ea" PRIMARY KEY ("user_id", "channel_id")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_d65f8fc92eb72b5a678084397e4" UNIQUE ("platform")`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_16f3639f33054083eb7a458cd0f" FOREIGN KEY ("channel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_34671d2386b947862a983242491" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
