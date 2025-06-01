import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1748783708515 implements MigrationInterface {
    name = 'Init1748783708515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "departments_shop_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "channels_department_id_fkey"`);
        await queryRunner.query(`CREATE TABLE "skus" ("id" SERIAL NOT NULL, "sId" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "images" text NOT NULL DEFAULT '[]', "price" integer NOT NULL, "originPrice" integer NOT NULL, "isActive" boolean NOT NULL, "status" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "shopId" uuid, "itemId" integer, CONSTRAINT "UQ_bfabeb9d1b67c691028cdfd55c1" UNIQUE ("sId"), CONSTRAINT "PK_334d59b0b01e5f2193966266e27" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "item" ("id" SERIAL NOT NULL, "sId" character varying NOT NULL, "type" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "images" text NOT NULL DEFAULT '[]', "price" integer NOT NULL, "originPrice" integer NOT NULL, "status" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "shopId" uuid, "categoryId" character varying, CONSTRAINT "UQ_f7385b123b638dc202e87bc9205" UNIQUE ("sId"), CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" character varying NOT NULL, "type" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "images" text NOT NULL DEFAULT '[]', "status" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "shopId" uuid, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "token_key"`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "departmentId" integer`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "departments" ALTER COLUMN "is_public" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "status" SET DEFAULT 'inactive'`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "skus" ADD CONSTRAINT "FK_8f1455e8f5109287498de4feed6" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "skus" ADD CONSTRAINT "FK_dc0f816a920fbae07fd197e9dd6" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item" ADD CONSTRAINT "FK_dd71c536045100b9cf3a05754b7" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item" ADD CONSTRAINT "FK_c0c8f47a702c974a77812169bc2" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_13d598bf4d052adfce75b24d44a" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_cb6700c1452458b40bba74f8723" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_cb6700c1452458b40bba74f8723"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_13d598bf4d052adfce75b24d44a"`);
        await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_c0c8f47a702c974a77812169bc2"`);
        await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_dd71c536045100b9cf3a05754b7"`);
        await queryRunner.query(`ALTER TABLE "skus" DROP CONSTRAINT "FK_dc0f816a920fbae07fd197e9dd6"`);
        await queryRunner.query(`ALTER TABLE "skus" DROP CONSTRAINT "FK_8f1455e8f5109287498de4feed6"`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "departments" ALTER COLUMN "is_public" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "departmentId"`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "token_key" character varying(255)`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "item"`);
        await queryRunner.query(`DROP TABLE "skus"`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "channels_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "departments_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
