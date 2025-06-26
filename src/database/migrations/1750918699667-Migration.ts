import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1750918699667 implements MigrationInterface {
    name = 'Migration1750918699667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_34671d2386b947862a983242491"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_16f3639f33054083eb7a458cd0f"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_edf33f6c237b06704f3d57542cd"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "UQ_fc0741a526342c15788fe62c08e" UNIQUE ("channel_id", "external_id")`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_34671d2386b947862a983242491" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_edf33f6c237b06704f3d57542cd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_16f3639f33054083eb7a458cd0f" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_16f3639f33054083eb7a458cd0f"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_edf33f6c237b06704f3d57542cd"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_34671d2386b947862a983242491"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "UQ_fc0741a526342c15788fe62c08e"`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_edf33f6c237b06704f3d57542cd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_16f3639f33054083eb7a458cd0f" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_34671d2386b947862a983242491" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
