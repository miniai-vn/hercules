import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749095607161 implements MigrationInterface {
    name = 'Migration1749095607161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD "channelId" integer`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_9441b9af98ab993ff6a24c52ecf" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_9441b9af98ab993ff6a24c52ecf"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "channelId"`);
    }

}
