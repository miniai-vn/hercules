import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749096820269 implements MigrationInterface {
    name = 'Migration1749096820269'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD "channel_id" integer`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_1a99838ee2e2e940ad98ed2e9d8" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_1a99838ee2e2e940ad98ed2e9d8"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "channel_id"`);
    }

}
