import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1750243647179 implements MigrationInterface {
    name = 'Migration1750243647179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_department" DROP CONSTRAINT "FK_7044b4fcd0d40c6f11ed27a0b70"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP CONSTRAINT "FK_92bb51ffd463f2dfba95539e10d"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "roles_shop_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" DROP CONSTRAINT "user_department_permissions_user_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" DROP CONSTRAINT "user_department_permissions_permission_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" DROP CONSTRAINT "user_department_permissions_department_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_34671d2386b947862a983242491"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_shop_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "user_role_user_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "user_role_role_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_16f3639f33054083eb7a458cd0f"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_edf33f6c237b06704f3d57542cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_92bb51ffd463f2dfba95539e10"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7044b4fcd0d40c6f11ed27a0b7"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP COLUMN "shop_id"`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD "role" character varying NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD "joined_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_32a6fc2fcb019d8e3a8ace0f55" ON "user_role" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d0e5815877f7395a198a4cb0a4" ON "user_role" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "user_department" ADD CONSTRAINT "FK_92bb51ffd463f2dfba95539e10d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD CONSTRAINT "FK_7044b4fcd0d40c6f11ed27a0b70" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_7d59fd4b3ee68070a3403eaad13" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" ADD CONSTRAINT "FK_864057fd9c3c7045bebcbe93de9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" ADD CONSTRAINT "FK_86fc5b0651530c16874ed38b57c" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" ADD CONSTRAINT "FK_1d4ae73c5e08b12f9a25c8c6fa2" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_34671d2386b947862a983242491" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_role" ADD CONSTRAINT "FK_32a6fc2fcb019d8e3a8ace0f55f" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_role" ADD CONSTRAINT "FK_d0e5815877f7395a198a4cb0a46" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_edf33f6c237b06704f3d57542cd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_16f3639f33054083eb7a458cd0f" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_16f3639f33054083eb7a458cd0f"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_edf33f6c237b06704f3d57542cd"`);
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "FK_d0e5815877f7395a198a4cb0a46"`);
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "FK_32a6fc2fcb019d8e3a8ace0f55f"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4"`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" DROP CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_34671d2386b947862a983242491"`);
        await queryRunner.query(`ALTER TABLE "tag_customers" DROP CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90"`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" DROP CONSTRAINT "FK_1d4ae73c5e08b12f9a25c8c6fa2"`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" DROP CONSTRAINT "FK_86fc5b0651530c16874ed38b57c"`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" DROP CONSTRAINT "FK_864057fd9c3c7045bebcbe93de9"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_7d59fd4b3ee68070a3403eaad13"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP CONSTRAINT "FK_7044b4fcd0d40c6f11ed27a0b70"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP CONSTRAINT "FK_92bb51ffd463f2dfba95539e10d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d0e5815877f7395a198a4cb0a4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_32a6fc2fcb019d8e3a8ace0f55"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "permissions" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP COLUMN "joined_at"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "user_department" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD "shop_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id", "shop_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_7044b4fcd0d40c6f11ed27a0b7" ON "user_department" ("department_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_92bb51ffd463f2dfba95539e10" ON "user_department" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_edf33f6c237b06704f3d57542cd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_16f3639f33054083eb7a458cd0f" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_88701195cb06cac71eb9eec1d7a" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_conversations" ADD CONSTRAINT "FK_71e6e2c6b8fd93fd9c8559268c4" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_1a6c8e8a62275a0a7255374ca90" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tag_customers" ADD CONSTRAINT "FK_34671d2386b947862a983242491" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" ADD CONSTRAINT "user_department_permissions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" ADD CONSTRAINT "user_department_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_department_permissions" ADD CONSTRAINT "user_department_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "roles_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD CONSTRAINT "FK_92bb51ffd463f2dfba95539e10d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_department" ADD CONSTRAINT "FK_7044b4fcd0d40c6f11ed27a0b70" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
