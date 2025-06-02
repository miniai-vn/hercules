import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSkusSchema1748831543467 implements MigrationInterface {
    name = 'UpdateSkusSchema1748831543467'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "skus" DROP CONSTRAINT "FK_c6b58a877814846f43e8124fc4e"`);
        await queryRunner.query(`ALTER TABLE "skus" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "skus" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "skus" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "skus" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "skus" ADD CONSTRAINT "FK_c6b58a877814846f43e8124fc4e" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "skus" DROP CONSTRAINT "FK_c6b58a877814846f43e8124fc4e"`);
        await queryRunner.query(`ALTER TABLE "skus" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "skus" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "skus" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "skus" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "skus" ADD CONSTRAINT "FK_c6b58a877814846f43e8124fc4e" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
