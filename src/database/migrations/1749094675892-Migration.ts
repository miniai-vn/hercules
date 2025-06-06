import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749094675892 implements MigrationInterface {
    name = 'Migration1749094675892'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "users_shop_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP CONSTRAINT "user_department_user_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP CONSTRAINT "user_department_department_id_fkey"`);
        await queryRunner.query(`CREATE TABLE "conversation_members" ("id" SERIAL NOT NULL, "conversation_id" integer NOT NULL, "participant_type" character varying NOT NULL, "customer_id" uuid, "user_id" uuid, "joined_at" TIMESTAMP WITH TIME ZONE, "left_at" TIMESTAMP WITH TIME ZONE, "is_active" boolean NOT NULL DEFAULT true, "member_settings" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_33146a476696a973a14d931e675" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message_recipients" ("id" SERIAL NOT NULL, "message_id" integer NOT NULL, "receiver_type" character varying NOT NULL, "receiver_id" uuid NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e402cb51e37423da8d8a94cb3e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "channel"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "avatar" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "sender_id" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "PK_133ec679a801fab5e070f73d3ea"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_d65f8fc92eb72b5a678084397e4" UNIQUE ("platform")`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_92bb51ffd463f2dfba95539e10" ON "user_department" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7044b4fcd0d40c6f11ed27a0b7" ON "user_department" ("department_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_39e0ab619d2865a101db749751a" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_36340a1704b039608e34244511f" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_06457ade4cd8d4d4143b813de0e" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_a46c76be8f62c4b00a835cdc370" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ADD CONSTRAINT "FK_ba7ae7820d8342815027197b515" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD CONSTRAINT "FK_92bb51ffd463f2dfba95539e10d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD CONSTRAINT "FK_7044b4fcd0d40c6f11ed27a0b70" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_department" DROP CONSTRAINT "FK_7044b4fcd0d40c6f11ed27a0b70"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP CONSTRAINT "FK_92bb51ffd463f2dfba95539e10d"`);
        await queryRunner.query(`ALTER TABLE "message_recipients" DROP CONSTRAINT "FK_ba7ae7820d8342815027197b515"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_a46c76be8f62c4b00a835cdc370"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_06457ade4cd8d4d4143b813de0e"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_36340a1704b039608e34244511f"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_39e0ab619d2865a101db749751a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7044b4fcd0d40c6f11ed27a0b7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_92bb51ffd463f2dfba95539e10"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_d65f8fc92eb72b5a678084397e4"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "PK_133ec679a801fab5e070f73d3ea"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "sender_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD "role" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "channel" character varying(255)`);
        await queryRunner.query(`DROP TABLE "message_recipients"`);
        await queryRunner.query(`DROP TABLE "conversation_members"`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD CONSTRAINT "user_department_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD CONSTRAINT "user_department_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
