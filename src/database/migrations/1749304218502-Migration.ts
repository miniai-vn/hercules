import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749304218502 implements MigrationInterface {
    name = 'Migration1749304218502'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "color" character varying(7) NOT NULL DEFAULT '#6B7280', "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "shop_id" uuid NOT NULL, CONSTRAINT "valid_color_format" CHECK (color ~ '^#[0-9A-Fa-f]{6}$'), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tag_customers" ("tag_id" integer NOT NULL, "customer_id" uuid NOT NULL, CONSTRAINT "PK_b3eb48134d62ed44cd70c33dc47" PRIMARY KEY ("tag_id", "customer_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1a6c8e8a62275a0a7255374ca9" ON "tag_customers" ("tag_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_34671d2386b947862a98324249" ON "tag_customers" ("customer_id") `);
        await queryRunner.query(`CREATE TABLE "tag_conversations" ("tag_id" integer NOT NULL, "conversation_id" integer NOT NULL, CONSTRAINT "PK_c5f9637ba250b3c43eb7a6fa56a" PRIMARY KEY ("tag_id", "conversation_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_88701195cb06cac71eb9eec1d7" ON "tag_conversations" ("tag_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_71e6e2c6b8fd93fd9c8559268c" ON "tag_conversations" ("conversation_id") `);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_ababfb5efdac0d785efb19722d7"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "UQ_ababfb5efdac0d785efb19722d7"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_1db9cb6e63c70aa9d576dea086b" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_ababfb5efdac0d785efb19722d7" FOREIGN KEY ("last_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_34671d2386b947862a983242491" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_34671d2386b947862a983242491"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_ababfb5efdac0d785efb19722d7"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_1db9cb6e63c70aa9d576dea086b"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "UQ_ababfb5efdac0d785efb19722d7" UNIQUE ("last_message_id")`);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_ababfb5efdac0d785efb19722d7" FOREIGN KEY ("last_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71e6e2c6b8fd93fd9c8559268c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88701195cb06cac71eb9eec1d7"`);
        await queryRunner.query(`DROP TABLE "tag_conversations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_34671d2386b947862a98324249"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a6c8e8a62275a0a7255374ca9"`);
        await queryRunner.query(`DROP TABLE "tag_customers"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
