import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749205018243 implements MigrationInterface {
    name = 'Migration1749205018243'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "phone" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "email" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "address" text`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "note" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "phone"`);
    }

}
