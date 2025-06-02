import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1748846808128 implements MigrationInterface {
    name = 'Migration1748846808128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channels" ADD "is_use_product_from_miniapp" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "is_use_product_from_miniapp"`);
    }

}
