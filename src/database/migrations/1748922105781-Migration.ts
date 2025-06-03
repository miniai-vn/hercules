import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1748922105781 implements MigrationInterface {
    name = 'Migration1748922105781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "departments_shop_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "channels_department_id_fkey"`);
        await queryRunner.query(`CREATE TABLE "skus" ("id" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "images" text NOT NULL DEFAULT '[]', "price" integer NOT NULL, "origin_price" integer, "is_active" boolean NOT NULL, "status" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "shop_id" uuid, "item_id" character varying, CONSTRAINT "PK_334d59b0b01e5f2193966266e27" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "item" ("id" character varying NOT NULL, "type" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "images" text NOT NULL DEFAULT '[]', "price" integer NOT NULL, "status" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "shop_id" uuid, "category_id" character varying, CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" character varying NOT NULL, "type" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "images" text NOT NULL DEFAULT '[]', "status" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "shop_id" uuid, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "is_use_product_from_miniapp" boolean`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "shops" ADD CONSTRAINT "UQ_36ed6193561ca26ca821ec1b587" UNIQUE ("token_key")`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "departments" ALTER COLUMN "is_public" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "status" SET DEFAULT 'inactive'`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "skus" ADD CONSTRAINT "FK_2645c950812284757b1b946cb7e" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "skus" ADD CONSTRAINT "FK_c6b58a877814846f43e8124fc4e" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item" ADD CONSTRAINT "FK_901170f1504825653bf1298e1e1" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "item" ADD CONSTRAINT "FK_91ba90f150e8804bdaad7b17ff8" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_b7782b67d6bffd48a980289eee1" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "FK_ab268a6a4f8e13a2dab3cbb25a4" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_3fb20ba825fc4ff96b72814584b" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_3fb20ba825fc4ff96b72814584b"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "FK_ab268a6a4f8e13a2dab3cbb25a4"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_b7782b67d6bffd48a980289eee1"`);
        await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_91ba90f150e8804bdaad7b17ff8"`);
        await queryRunner.query(`ALTER TABLE "item" DROP CONSTRAINT "FK_901170f1504825653bf1298e1e1"`);
        await queryRunner.query(`ALTER TABLE "skus" DROP CONSTRAINT "FK_c6b58a877814846f43e8124fc4e"`);
        await queryRunner.query(`ALTER TABLE "skus" DROP CONSTRAINT "FK_2645c950812284757b1b946cb7e"`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "departments" ALTER COLUMN "is_public" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "updated_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "shops" DROP CONSTRAINT "UQ_36ed6193561ca26ca821ec1b587"`);
        await queryRunner.query(`ALTER TABLE "shops" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "is_use_product_from_miniapp"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "item"`);
        await queryRunner.query(`DROP TABLE "skus"`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "channels_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "departments_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
