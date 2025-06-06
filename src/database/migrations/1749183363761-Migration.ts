import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749183363761 implements MigrationInterface {
    name = 'Migration1749183363761'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD "avatar" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "avatar"`);
    }

}
