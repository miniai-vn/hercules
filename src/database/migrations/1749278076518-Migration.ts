import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749278076518 implements MigrationInterface {
    name = 'Migration1749278076518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD "last_message_id" integer`);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_ababfb5efdac0d785efb19722d7" FOREIGN KEY ("last_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_ababfb5efdac0d785efb19722d7"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP COLUMN "last_message_id"`);
    }

}
